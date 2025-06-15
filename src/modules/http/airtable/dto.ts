export interface AirtableRecord<TFields> {
  id: string;
  createdTime: string;
  fields: TFields;
}

export interface AirtableListResponse<TFields> {
  records: Array<AirtableRecord<TFields>>;
  offset?: string;
}

// Request body for creating a single record
export interface AirtableCreateRecordRequest<TFields> {
  fields: TFields;
  typecast?: boolean;
}

// Request body for updating a single record (partial update)
export interface AirtableUpdateRecordRequest<TFields> {
  fields: Partial<TFields>;
  typecast?: boolean;
}

// Options for listing records
export interface AirtableListOptions {
  fields?: string[];
  filterByFormula?: string;
  maxRecords?: number;
  pageSize?: number;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  view?: string;
  offset?: string;
  cellFormat?: 'json' | 'string';
  timeZone?: string;
  userLocale?: string;
  returnFieldsByFieldId?: boolean;
}
