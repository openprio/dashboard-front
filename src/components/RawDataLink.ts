import { extract_timestamp } from "../util/time_util";

type RawDataLink = {
  linkText: string;
  content: string;
};

function getRawDataLink(dataownerCode: string, vehicleNumber: string, timestamp: string) {
  if (!vehicleNumber || !timestamp) {
      return;
  }


  return {
    linkText: extract_timestamp(timestamp),
    content: `/raw_data?dataowner_code=${dataownerCode}&vehicle_number=${vehicleNumber}&timestamp=${new Date(timestamp).valueOf()}`,
  }

}

export { getRawDataLink };
export type { RawDataLink };
