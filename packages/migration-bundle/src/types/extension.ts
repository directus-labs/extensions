import type { SchemaOverview, Collection, Role, Policy, Permission, User, File, FlowRaw, Operation, Settings, Preset, Comment, Share, Relation, RelationMeta, Item } from '@directus/types';

type ExtensionType = 'bundle' | 'interface' | 'module' | 'operation' | 'panel';

export interface DirectusError {
    name: string;
    headers?: Record<string,any> | {};
    status: number;
    response?: Record<string,any> | {};
    errors: ErrorMessage[];
}

interface ErrorMessage {
  message: string;
  extensions?: {
    reason: string;
    code: string;
  };
};

export interface ExtensionMeta {
  bundle: null | string;
  enabled: boolean;
  folder: string;
  id: string;
  source: 'local' | 'registry';
}

export interface ExtensionSchema {
  entries?: Array<{
    name: string;
    type: ExtensionType;
  }>;
  entrypoint: {
    api: string;
    app: string;
  } | string;
  host: string;
  local: boolean;
  name: string;
  path: string;
  sandbox?: {
    enabled: boolean;
    requestedScopes: {
      log: Record<string, unknown>;
      request?: {
        methods: string[];
        urls: string[];
      };
    };
  };
  type: ExtensionType;
  version: string;
}

export interface Extension {
  bundle: null | string;
  id: string;
  meta: ExtensionMeta;
  schema: ExtensionSchema;
}

export type Extensions = Extension[];

export type Payload = {
    baseURL: string,
    token: string,
    dryRun?: boolean;
}

export interface UserRaw extends Omit<User, 'avatar' | 'role' | 'last_access' | 'policies' | 'email' | 'password' | 'token' | 'last_page'>{
  email?: string | null;
  avatar: string;
  role: string;
  token?: string | null;
  last_page?: string | null;
  last_access?: "datetime" | null;
  policies?: string[];
  password?: string;
}

export interface Access {
    id: string;
    policy: string;
    name?: string;
    role?: null | string;
    sort: null | number;
    user: null | string;
};

export type Dashboard = {
	id: string;
	name: string;
	note: string;
	icon: string;
	color: string;
	date_created: string;
	user_created: string;
  panels?: string[];
};

export type Panel = {
	id: string;
	dashboard: string;
	show_header: boolean;
	name: string;
	icon: string;
	color: string;
	note: string;
	type: string;
	position_x: number;
	position_y: number;
	width: number;
	height: number;
	options: Record<string, any>;
	date_created: string;
	user_created: string;
};

export interface OperationRaw {
	id: string;
	name: string | null;
	key: string;
	type: string;
	position_x: number;
	position_y: number;
	options: Record<string, any>;
	resolve?: string | null;
	reject?: string | null;
	flow: string;
	date_created?: 'datetime' | null;
	user_created?: string;
}

export type Folder = {
	id: string;
	name: string;
	parent: string | null;
	children?: Folder[];
};

export type PolicyRaw = {
  id: string; // uuid
  name: string;
  icon: string;
  description: string | null;
  ip_access: string | null;
  enforce_tfa: boolean;
  admin_access: boolean;
  app_access: boolean;
};

export type RelationMetaRaw = RelationMeta & { id?: string };
export type RelationRaw = Relation & { meta: RelationMetaRaw | null };

export type RoleRaw = {
  id: string;
  name: string;
  description: string;
  icon: string;
  users?: string[];
  parent?: string;
};

export type Translation = {
  id: string; // uuid
  language: string;
  key: string;
  value: string;
};

export interface Scope {
  users: boolean;
  content: boolean;
  comments: boolean;
  presets: boolean;
  dashboards: boolean;
  extensions: boolean;
  flows: boolean;
  force: boolean;
};

export interface UserCollectionItems {
  collection: string,
  primaryKeyField: string;
  items: Item[] | null
};

export interface UserCollectionItem {
  collection: string,
  item: Item | null
};

export interface SystemExtract {
  roles: RoleRaw[] | null;
  policies: PolicyRaw[] | null;
  permissions: Permission[] | null;
  users: UserRaw[] | null;
  access: Access[] | null;
  folders: Folder[] | null;
  dashboards: DashboardRaw[] | null;
  flows: ModifiedFlowRaw[] | null;
  panels: PanelRaw[] | null;
  operations: OperationRaw[] | null;
  settings: Settings | {};
  translations: Translation[] | null;
  presets: Preset[] | null;
  extensions: Extension[] | null;
  comments: CommentRaw[] | null;
  shares: Share[] | null;
  system_errors: DirectusError | null,
  scope?: Scope;
};

export interface DataExtract {
  collections: Collection[] | null,
  fullData: UserCollectionItems[] | null,
  singletons: UserCollectionItem[] | null,
  files: File[] | null,
  data_errors: DirectusError | null,
  scope?: Scope;
};

export interface DashboardRaw extends Omit<Dashboard, 'date_created'> {
  date_created?: "datetime" | null;
};

export interface PanelRaw extends Omit<Panel, 'date_created'> {
  date_created?: "datetime" | null;
};

export interface ModifiedFlowRaw extends Omit<FlowRaw, 'date_created'> {
  date_created?: 'datetime';
};

export interface CommentRaw extends Omit<Comment, 'item' | 'date_created' | 'date_updated' | 'user_created' | 'user_updated'> {
  item?: string;
  date_created: 'datetime';
  date_updated: 'datetime' | null;
  user_created: string | null;
  user_updated: string | null;
};

export type JSONInput = SchemaOverview | Role | RoleRaw | Policy | PolicyRaw | Permission | User | UserRaw | Access | Folder | File | Dashboard | DashboardRaw | FlowRaw | ModifiedFlowRaw | OperationRaw | Panel | Operation | Settings | Translation | Preset | Extension | Comment | CommentRaw | Share | UserCollectionItems | UserCollectionItem;