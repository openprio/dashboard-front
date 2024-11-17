
function extract_timestamp(timestamp: string) {
    console.log(timestamp);
    if (timestamp == null) {
        return "";
    }

    const date = new Date(timestamp);

    // Extract hours, minutes, and seconds, and format them as HH:MM:SS
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    // Concatenate in HH:MM:SS format
    return `${hours}:${minutes}:${seconds}`;
}

export { extract_timestamp };