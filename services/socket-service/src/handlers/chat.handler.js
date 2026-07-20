import activeRooms from "../state/activeRooms.js";

export const registerChatHandlers = (socket) => {

    socket.on(

        "join-chat",

        ({ roomId }) => {

            if (

                !activeRooms.chats.has(roomId)

            ) {

                socket.emit(

                    "error",

                    {

                        message:

                            "Invalid Chat Room"

                    }

                );

                return;

            }

            socket.join(roomId);

            console.log(

                `💬 ${socket.id} joined Chat Room ${roomId}`

            );

            socket.emit(

                "joined-chat",

                {

                    roomId,

                }

            );

        }

    );

};