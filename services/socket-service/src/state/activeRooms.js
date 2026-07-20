/*
|--------------------------------------------------------------------------
| Active Rooms
|--------------------------------------------------------------------------
| This stores all valid rooms received through RabbitMQ.
| It is NOT Socket.IO's room storage.
|--------------------------------------------------------------------------
*/

const activeRooms = {

    negotiations: new Map(),

    chats: new Map(),

};

export default activeRooms;