import { NotFoundException } from "../../common/exeptions/error.exeptions.js";
import { MessageModel } from "../../DB/model/message.model.js";
import { UserModel } from "../../DB/model/user.model.js";
import { findById,
    findOne,
    findOneAndDelete,
    paginate } from "../../common/respository/base.repository.js";
    import { unlink } from "node:fs/promises";
import {
    resolve,
    relative,
    isAbsolute
} from "node:path";




export const createMessage = async ({ content, receiverId } = {}, files = [], user = undefined) => {
    const checkReceiverExist = await findById({
        model: UserModel,
        id: receiverId

    })
    if (!checkReceiverExist) {
        throw NotFoundException("Invalid receiverId , user not found")
    }
    const message = await MessageModel.create({
        content,
        receiverId,
        attachments: files.map((file) => file.finalpath),
        ...(user ? { senderId: user._id } : {})
    }); return message;
}


export const getAllMessages = async ({
    type = "0",
    page = "all",
    size = 5
} = {}, user) => {

    let filter = {};

    if (type === "0") {
        filter = {
            receiverId: user._id
        };
    } else if (type === "1") {
        filter = {
            senderId: user._id
        };
    } else {
        filter = {
            $or: [
                { senderId: user._id },
                { receiverId: user._id }
            ]
        };
    }

    const messages = await paginate({
        model: MessageModel,
        filter,
        page,
        size,
        options: {
            sort: { createdAt: -1 }
        }
    });

    return messages;
};


export const getMessageById = async ({
    messageId
} = {}, user) => {

    const message = await findOne({
        model: MessageModel,
        filter: {
            _id: messageId,
            $or: [
                { receiverId: user._id },
                { senderId: user._id }
            ]
        }
    });

    if (!message) {
        throw NotFoundException({
            message: "Message not found"
        });
    }

    return message;
};


const deleteMessageAttachments = async (attachments = []) => {

    const messagesDirectory = resolve("assets", "messages");

    for (const attachment of attachments) {

        const filePath = resolve(attachment);
        const relativePath = relative(
            messagesDirectory,
            filePath
        );

        if (
            !relativePath ||
            relativePath.startsWith("..") ||
            isAbsolute(relativePath)
        ) {
            continue;
        }

        try {

            await unlink(filePath);

        } catch (error) {

            if (error.code !== "ENOENT") {
                console.error(
                    "Failed to delete message attachment:",
                    error.message
                );
            }

        }
    }
};


export const deleteMessage = async ({
    messageId
} = {}, user) => {

    const message = await findOneAndDelete({
        model: MessageModel,
        filter: {
            _id: messageId,
            receiverId: user._id
        }
    });

    if (!message) {
        throw NotFoundException({
            message: "Message not found"
        });
    }

    await deleteMessageAttachments(message.attachments);

    return message;
};


