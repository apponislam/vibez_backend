import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { FAQModel } from "./faq.model";

const createFAQ = async (userId: string, payload: any) => {
    const faq = await FAQModel.create({
        ...payload,
        createdBy: new Types.ObjectId(userId),
    });
    return faq;
};

const getAllFAQs = async (query: any = {}) => {
    const filter: any = { isDeleted: false };
    if (query.isActive !== undefined) filter.isActive = query.isActive === "true";

    const faqs = await FAQModel.find(filter).sort({ createdAt: -1 });
    return faqs;
};

const getActiveFAQs = async () => {
    const filter: any = { isActive: true, isDeleted: false };
    const faqs = await FAQModel.find(filter).sort({ createdAt: -1 });
    return faqs;
};


const getFAQById = async (faqId: string) => {
    const faq = await FAQModel.findOne({ _id: faqId, isDeleted: false });
    if (!faq) throw new ApiError(httpStatus.NOT_FOUND, "FAQ not found");
    return faq;
};

const updateFAQ = async (faqId: string, payload: any) => {
    const faq = await FAQModel.findOneAndUpdate(
        { _id: faqId, isDeleted: false },
        { $set: payload },
        { returnDocument: "after", runValidators: true },
    );
    if (!faq) throw new ApiError(httpStatus.NOT_FOUND, "FAQ not found");
    return faq;
};

const toggleFAQStatus = async (faqId: string) => {
    const faq = await FAQModel.findOne({ _id: faqId, isDeleted: false });
    if (!faq) throw new ApiError(httpStatus.NOT_FOUND, "FAQ not found");
    faq.isActive = !faq.isActive;
    await faq.save();
    return faq;
};

const deleteFAQ = async (faqId: string) => {
    const faq = await FAQModel.findOneAndUpdate(
        { _id: faqId, isDeleted: false },
        { $set: { isDeleted: true, isActive: false } },
        { returnDocument: "after" },
    );
    if (!faq) throw new ApiError(httpStatus.NOT_FOUND, "FAQ not found");
    return faq;
};

export const faqServices = {
    createFAQ,
    getAllFAQs,
    getActiveFAQs,
    getFAQById,
    updateFAQ,
    toggleFAQStatus,
    deleteFAQ,
};
