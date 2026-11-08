
const applyQueryOptions = (doc, options = {}) => {

    if (options.select) {
        doc.select(options.select);
    }

    if (options.sort) {
        doc.sort(options.sort);
    }

    if (options.skip !== undefined) {
        doc.skip(options.skip);
    }

    if (options.limit !== undefined) {
        doc.limit(options.limit);
    }

    if (options.populate) {
        doc.populate(options.populate);
    }

    if (options.lean !== undefined) {
        doc.lean(options.lean);
    }

    return doc;
};


export const findById = async ({
    id,
    options = {},
    model
} = {}) => {

    const doc = model.findById(id);

    applyQueryOptions(doc, options);

    return await doc.exec();
};


export const findOne = async ({
    filter = {},
    options = {},
    model
} = {}) => {

    const doc = model.findOne(filter);

    applyQueryOptions(doc, options);

    return await doc.exec();
};


export const find = async ({
    filter = {},
    options = {},
    model
} = {}) => {

    const doc = model.find(filter);

    applyQueryOptions(doc, options);

    return await doc.exec();
};


export const paginate = async ({
    filter = {},
    options = {},
    select,
    page = "all",
    size = 5,
    model
} = {}) => {

    let docsCount;
    let pages;
    let currentPage;

    const queryOptions = { ...options };

    if (page !== "all") {

        currentPage = Math.max(1, Math.floor(Number(page) || 1));

        const limit = Math.min(
            100,
            Math.max(1, Math.floor(Number(size) || 5))
        );

        queryOptions.limit = limit;
        queryOptions.skip = (currentPage - 1) * limit;

        docsCount = await model.countDocuments(filter);
        pages = Math.ceil(docsCount / limit);
    }

    if (select) {
        queryOptions.select = select;
    }

    const result = await find({
        model,
        filter,
        options: queryOptions
    });

    return {
        docsCount,
        limit: queryOptions.limit,
        pages,
        currentPage,
        result
    };
};


export const create = async ({
    data,
    options,
    model
} = {}) => {

    return await model.create(data, options);
};


export const insertMany = async ({
    data,
    model
} = {}) => {

    return await model.insertMany(data);
};


export const updateOne = async ({
    filter = {},
    update = {},
    options = {},
    model
} = {}) => {

    if (Array.isArray(update)) {

        const updatePipeline = [
            ...update,
            {
                $set: {
                    __v: {
                        $add: [
                            { $ifNull: ["$__v", 0] },
                            1
                        ]
                    }
                }
            }
        ];

        return await model.updateOne(
            filter,
            updatePipeline,
            {
                ...options,
                updatePipeline: true,
                runValidators: true
            }
        );
    }

    const updateData = { ...update };

    updateData.$inc = {
        ...(updateData.$inc || {}),
        __v: 1
    };

    return await model.updateOne(
        filter,
        updateData,
        {
            runValidators: true,
            ...options
        }
    );
};


export const findOneAndUpdate = async ({
    filter = {},
    update = {},
    options = {},
    model
} = {}) => {

    if (Array.isArray(update)) {

        const updatePipeline = [
            ...update,
            {
                $set: {
                    __v: {
                        $add: [
                            { $ifNull: ["$__v", 0] },
                            1
                        ]
                    }
                }
            }
        ];

        return await model.findOneAndUpdate(
            filter,
            updatePipeline,
            {
                new: true,
                runValidators: true,
                ...options,
                updatePipeline: true
            }
        );
    }

    const updateData = { ...update };

    updateData.$inc = {
        ...(updateData.$inc || {}),
        __v: 1
    };

    return await model.findOneAndUpdate(
        filter,
        updateData,
        {
            new: true,
            runValidators: true,
            ...options
        }
    );
};


export const findByIdAndUpdate = async ({
    id,
    update = {},
    options = {},
    model
} = {}) => {

    const updateData = { ...update };

    updateData.$inc = {
        ...(updateData.$inc || {}),
        __v: 1
    };

    return await model.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true,
            ...options
        }
    );
};


export const deleteOne = async ({
    filter = {},
    model
} = {}) => {

    return await model.deleteOne(filter);
};


export const deleteMany = async ({
    filter = {},
    model
} = {}) => {

    return await model.deleteMany(filter);
};


export const findOneAndDelete = async ({
    filter = {},
    options = {},
    model
} = {}) => {

    return await model.findOneAndDelete(
        filter,
        options
    );
};
