import React from "react";
import Avatar from "./Avatar";

export interface MessageInfo {
  content: string;
  displayName: string;
  assigned: boolean;
}

function MessageCard(props: MessageInfo) {
  return (
    <div className="p-4 w-full self-end flex items-center hover:bg-[#e0f7ff] rounded-xl hover:cursor-pointer mb-3 shadow-sm">
      <div className="mr-5">
        <Avatar userName={props.displayName} />
      </div>
      <div>
        <span className="text-xl font-bold text-gray-800">
          {props.displayName}
        </span>
        <br />
        <span className="opacity-70 text-sm line-clamp-2 text-gray-600">
          {props.content}
        </span>
      </div>
    </div>
  );
}

export default MessageCard;
