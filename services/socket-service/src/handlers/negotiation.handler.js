import activeRooms from "../state/activeRooms.js";

export const registerNegotiationHandlers = (socket) => {

    socket.on(

        "join-negotiation",

        ({ roomId }) => {

            if (

                !activeRooms.negotiations.has(roomId)

            ) {

                socket.emit(

                    "error",

                    {

                        message:
                            "Invalid Negotiation Room"

                    }

                );

                return;

            }

            socket.join(roomId);

            console.log(

                `🤝 ${socket.id} joined Negotiation Room ${roomId}`

            );

            socket.emit(

                "joined-negotiation",

                {

                    roomId,

                }

            );

        }

    );

};