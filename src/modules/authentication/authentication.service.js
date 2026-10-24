
import { EmailSubjectEnum } from "../../common/enum/email.enum.js";
import {
    ConflictException,
    NotFoundException,
    UnauthorizedException,
} from "../../common/exeptions/index.js";

import {
    create,
    findOne,
} from "../../common/respository/index.js";

import {
    compare,
    createLoginCredentials,
    encryption,
    hash,
} from "../../common/security/index.js";
import { emailEvent } from "../../common/utlis/email/email.event.js";
import { sendEmail } from "../../common/utlis/index.js";

import { UserModel } from "../../DB/model/user.model.js";

export const signup = async ({ email, password, username, phone }) => {
    const duplicatedAccount = await findOne({
        model: UserModel,
        filter: { email },
        options: { select: "email" },
    });

    if (duplicatedAccount) {
        throw ConflictException({
            code: 1001,
        });
    }

    const account = await create({
        model: UserModel,
        data: {
            username,
            email,
            password: await hash({
                plaintext: password,
            }),
            phone: await encryption(phone),
        },
    });

emailEvent.emit("sendEmail", {
    recipient: {
        to: email,
    },
    subject: EmailSubjectEnum.CONFIRM_EMAIL,
    data: {
    template: "Confirm Email",
        code: "123456",
        username,
        expiresInMinutes: 10,
    },
});

return account;
};

export const login = async (email, password, issuer) => {
    const account = await findOne({
        model: UserModel,
        filter: { email },
    });

    if (!account) {
        throw UnauthorizedException({
            code: 1002,
        });
    }

    const match = await compare(password, account.password);

    if (!match) {
        throw UnauthorizedException({
            code: 1002,
        });
    }

    return await createLoginCredentials({
        user: account,
        issuer,
    });
};
