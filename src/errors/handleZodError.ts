import { ZodError } from "zod";
import { TErrorSources, TGenericErrorResponse } from "../types/error";

const handleZodError = (err: ZodError): TGenericErrorResponse => {
    const errorSources: TErrorSources = err.issues.map((issue) => {
        const lastPath = issue.path[issue.path.length - 1];

        return {
            path: typeof lastPath === "symbol" ? lastPath.toString() : String(lastPath),
            message: issue.message,
        };
    });

    return {
        statusCode: 400,
        message: err.issues[0]?.message || "Validation error",
        errorSources,
    };
};

export default handleZodError;
