import moment from "moment";

export default class DatetimeManager {
  static default = (): string => moment().format();

  static withFormat = (format: string): string => moment().format(format);

  static log = (): string => moment().format("DD MMM YYYY HH:mm:ss");

  static validate = (data: string, format: string): boolean =>
    moment(data, format, true).isValid();
}
