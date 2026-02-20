import { init, id } from '@instantdb/react';

const APP_ID = '2fe12a08-0cfc-41ab-a965-52ff85171a67';

const db = init({ appId: APP_ID });

export { db, id };
