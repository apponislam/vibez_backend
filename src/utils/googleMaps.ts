import axios from "axios";
import config from "../app/config";

const GOOGLE_MAPS_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const GOOGLE_PLACES_TEXTSEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";

/**
 * Geocodes the address components (street, city, state, zipCode, country)
 * and returns the latitude and longitude.
 * @param address The address object containing components to geocode
 * @param restaurantName Optional name of the restaurant to query Places API
 */
export const getLatLngFromAddress = async (
    address: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    },
    restaurantName?: string
): Promise<{ lat: number; lng: number } | null> => {
    const apiKey = config.maps_api_key;
    if (!apiKey) {
        throw new Error("Maps API Key is not configured. Please set MAPS_API_KEY in your environment variables.");
    }

    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zipCode) parts.push(address.zipCode);
    if (address.country) parts.push(address.country);

    const addressQuery = parts.join(", ");
    if (!addressQuery) return null;

    // 1. If we have a restaurantName, try Google Places Text Search first
    if (restaurantName) {
        try {
            const query = `${restaurantName}, ${addressQuery}`;
            const response = await axios.get(GOOGLE_PLACES_TEXTSEARCH_URL, {
                params: {
                    query,
                    key: apiKey,
                },
            });

            if (response.data.status === "OK" && response.data.results?.length > 0) {
                const { lat, lng } = response.data.results[0].geometry.location;
                return { lat, lng };
            }
        } catch (error: any) {
            console.error("Google Places TextSearch error:", error.message);
        }
    }

    // 2. Fallback to standard Geocoding
    try {
        const response = await axios.get(GOOGLE_MAPS_GEOCODE_URL, {
            params: {
                address: addressQuery,
                key: apiKey,
            },
        });

        if (response.data.status === "OK" && response.data.results?.length > 0) {
            const { lat, lng } = response.data.results[0].geometry.location;
            return { lat, lng };
        }
        return null;
    } catch (error: any) {
        console.error("Google Geocoding error:", error.message);
        return null;
    }
};
