import axios from "axios";
import config from "../app/config";

const GOOGLE_MAPS_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

export interface GeocodeResult {
    lat: number;
    lng: number;
    formattedAddress: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    location: {
        type: "Point";
        coordinates: [number, number]; // [lng, lat]
    };
}

export interface ReverseGeocodeResult {
    formattedAddress: string;
    addressComponents: any[];
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    location: {
        type: "Point";
        coordinates: [number, number]; // [lng, lat]
    };
}

/**
 * Extract street, city, state, zipCode, and country from Google's address_components
 */
export const extractAddressComponents = (components: any[]) => {
    let streetNumber = "";
    let route = "";
    let city = "";
    let state = "";
    let zipCode = "";
    let country = "";

    for (const component of components) {
        const types = component.types;
        if (types.includes("street_number")) {
            streetNumber = component.long_name;
        } else if (types.includes("route")) {
            route = component.long_name;
        } else if (types.includes("locality")) {
            city = component.long_name;
        } else if (types.includes("administrative_area_level_1")) {
            state = component.long_name;
        } else if (types.includes("postal_code")) {
            zipCode = component.long_name;
        } else if (types.includes("country")) {
            country = component.long_name;
        }
    }

    // Fallbacks if locality is missing
    if (!city) {
        for (const component of components) {
            const types = component.types;
            if (types.includes("postal_town") || types.includes("sublocality") || types.includes("sublocality_level_1")) {
                city = component.long_name;
                break;
            }
        }
    }

    const street = [streetNumber, route].filter(Boolean).join(" ");

    return {
        street,
        city,
        state,
        zipCode,
        country,
    };
};

/**
 * Geocode an address (string or object) to get location coordinates and parsed address details.
 * @param address The address string or object with address properties to geocode
 */
export const geocodeAddress = async (
    address: string | { street?: string; city?: string; state?: string; zipCode?: string; country?: string }
): Promise<GeocodeResult> => {
    const apiKey = config.maps_api_key;
    if (!apiKey) {
        throw new Error("Maps API Key is not configured. Please set MAPS_API_KEY in your environment variables.");
    }

    let addressQuery = "";
    if (typeof address === "string") {
        addressQuery = address;
    } else {
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.zipCode) parts.push(address.zipCode);
        if (address.country) parts.push(address.country);
        addressQuery = parts.join(", ");
    }

    try {
        const response = await axios.get(GOOGLE_MAPS_GEOCODE_URL, {
            params: {
                address: addressQuery,
                key: apiKey,
            },
        });

        const { status, results } = response.data;

        if (status !== "OK") {
            throw new Error(`Geocoding failed with status: ${status}. ${response.data.error_message || ""}`);
        }

        if (!results || results.length === 0) {
            throw new Error("No results found for the provided address.");
        }

        const firstResult = results[0];
        const { lat, lng } = firstResult.geometry.location;
        const formattedAddress = firstResult.formatted_address;
        const components = extractAddressComponents(firstResult.address_components);

        return {
            lat,
            lng,
            formattedAddress,
            ...components,
            location: {
                type: "Point",
                coordinates: [lng, lat],
            },
        };
    } catch (error: any) {
        throw new Error(`Google Geocoding error: ${error.message}`);
    }
};

/**
 * Reverse geocode latitude and longitude to get the formatted address, components, and GeoJSON point.
 * @param lat Latitude
 * @param lng Longitude
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<ReverseGeocodeResult> => {
    const apiKey = config.maps_api_key;
    if (!apiKey) {
        throw new Error("Maps API Key is not configured. Please set MAPS_API_KEY in your environment variables.");
    }

    try {
        const response = await axios.get(GOOGLE_MAPS_GEOCODE_URL, {
            params: {
                latlng: `${lat},${lng}`,
                key: apiKey,
            },
        });

        const { status, results } = response.data;

        if (status !== "OK") {
            throw new Error(`Reverse geocoding failed with status: ${status}. ${response.data.error_message || ""}`);
        }

        if (!results || results.length === 0) {
            throw new Error("No results found for the provided coordinates.");
        }

        const firstResult = results[0];
        const formattedAddress = firstResult.formatted_address;
        const components = extractAddressComponents(firstResult.address_components);

        return {
            formattedAddress,
            addressComponents: firstResult.address_components,
            ...components,
            location: {
                type: "Point",
                coordinates: [lng, lat],
            },
        };
    } catch (error: any) {
        throw new Error(`Google Reverse Geocoding error: ${error.message}`);
    }
};

/**
 * Resolves coordinates and/or missing address components for a restaurant address object.
 * @param address The restaurantAddress object containing components and/or lat/lng coordinates
 */
export const resolveRestaurantAddress = async (address: any): Promise<any> => {
    if (!address) return address;

    try {
        if (address.lat !== undefined && address.lng !== undefined) {
            // If coordinates are provided, reverse-geocode to resolve/verify address components
            const lat = parseFloat(address.lat);
            const lng = parseFloat(address.lng);
            const geoResult = await reverseGeocode(lat, lng);

            address.street = address.street || geoResult.street;
            address.city = address.city || geoResult.city;
            address.state = address.state || geoResult.state;
            address.zipCode = address.zipCode || geoResult.zipCode;
            address.country = address.country || geoResult.country;
            address.location = {
                type: "Point",
                coordinates: [lng, lat],
            };
        } else if (address.street || address.city || address.zipCode) {
            // If address components are provided but coordinates are missing, geocode it
            const geoResult = await geocodeAddress(address);
            address.lat = geoResult.lat.toString();
            address.lng = geoResult.lng.toString();
            address.street = address.street || geoResult.street;
            address.city = address.city || geoResult.city;
            address.state = address.state || geoResult.state;
            address.zipCode = address.zipCode || geoResult.zipCode;
            address.country = address.country || geoResult.country;
            address.location = {
                type: "Point",
                coordinates: [geoResult.lng, geoResult.lat],
            };
        }
    } catch (geoError) {
        console.error("Google Maps API resolution failed:", geoError);
        // Fallback: If geocoding fails, try to parse lat/lng if manually provided in input address
        if (address.lat !== undefined && address.lng !== undefined) {
            const lat = parseFloat(address.lat);
            const lng = parseFloat(address.lng);
            address.location = {
                type: "Point",
                coordinates: [lng, lat],
            };
        }
    }

    return address;
};
