export interface CommentCollectionType {
  collection: string;
  field: string | number;
}

export interface Packet {
  collection_name: string;
  field_id: number;
  item_id: string | number;
}