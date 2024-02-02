/**
 * @typedef {{
 *     longitude: number,
 *     latitude: number,
 *     bearing: number,
 *     speed: number,
 *     accuracy: number,
 * }} Position
 */

/**
 * @typedef {{
 *     dataOwnerCode: string,
 *     vehicleNumber: number,
 * }} VehicleDescriptor
 */

/**
 * @typedef {{
 *     position: Position,
 *     timestamp: number,
 *     vehicleDescriptor: number,
 *     accuracy: number,
 * }} LocationMessage
 */