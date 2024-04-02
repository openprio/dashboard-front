/**
 * @typedef {{
 *     longitude: number,
 *     latitude: number,
 *     bearing: number,
 *     speed: number,
 *     accuracy: number,
 *     hdop: number,
 *     odometer: number,
 * }} Position
 */

/**
 * @typedef {{
 *     blockCode: number,
 *     drivingDirection: number,
 *     numberOfVehiclesCoupled: number,
 *     dataOwnerCode: string,
 *     vehicleNumber: number,
 * }} VehicleDescriptor
 */

/**
 * @typedef {{
 *     doorStatus: number,
 *     position: Position,
 *     timestamp: number,
 *     vehicleDescriptor: VehicleDescriptor,
 * }} LocationMessage
 */