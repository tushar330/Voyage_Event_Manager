import React from "react";
import { ChatMessage } from "@/types/negotiation";

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage?: (message: string) => void;
  readOnly?: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  readOnly = false,
}) => {
  const [newMessage, setNewMessage] = React.useState("");

  const handleSend = () => {
    if (newMessage.trim() && onSendMessage) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900">Remarks & History</h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-96">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 text-sm">No remarks yet.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "System"
                  ? "items-center"
                  : msg.sender === "Agent"
                    ? "items-end"
                    : "items-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.sender === "System"
                    ? "bg-gray-100 text-gray-600 text-xs italic"
                    : msg.sender === "Agent"
                      ? "bg-blue-100 text-blue-900"
                      : "bg-green-100 text-green-900"
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                {msg.sender !== "System" && (
                  <span className="text-[10px] opacity-70 mt-1 block text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              {msg.sender !== "System" && (
                <span className="text-xs text-gray-400 mt-1">{msg.sender}</span>
              )}
            </div>
          ))
        )}
      </div>
      {!readOnly && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Add a remark..."
              className="flex-1 rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
