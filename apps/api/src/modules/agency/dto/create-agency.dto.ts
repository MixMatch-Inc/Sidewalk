export class CreateAgencyDto {
  name: string;
  district?: string;
  country?: string;
  coverage?: Record<string, any>;
}