import { SettingsModel } from "./settings.model";
import { ISettings } from "./settings.interface";

const getSettings = async (): Promise<ISettings> => {
    let settings = await SettingsModel.findOne();
    if (!settings) {
        // Create initial settings document if it doesn't exist
        settings = await SettingsModel.create({});
    }
    return settings;
};

const updateSettings = async (data: Partial<ISettings>): Promise<ISettings> => {
    let settings = await SettingsModel.findOne();
    if (!settings) {
        settings = await SettingsModel.create(data);
    } else {
        settings = await SettingsModel.findByIdAndUpdate(
            settings._id,
            { $set: data },
            { returnDocument: 'after', runValidators: true }
        ) as any;
    }
    return settings!;
};

export const settingsServices = {
    getSettings,
    updateSettings,
};
