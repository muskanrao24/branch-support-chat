import React, { FC, useMemo } from "react";
import { minidenticon } from "minidenticons";

const avatarColors = [
  "#ffdd00",
  "#fbb034",
  "#ff4c4c",
  "#c1d82f",
  "#f48924",
  "#7ac143",
  "#30c39e",
  "#06BCAE",
  "#0695BC",
  "#037ef3",
  "#146eb4",
  "#8e43e7",
  "#ea1d5d",
  "#fc636b",
  "#ff6319",
  "#e01f3d",
  "#a0ac48",
  "#00d1b2",
  "#472f92",
  "#388ed1",
  "#a6192e",
  "#4a8594",
  "#7B9FAB",
  "#1393BD",
  "#5E13BD",
  "#E208A7",
];

export interface AvatarProps {
  containerClassName?: string;
  sizeClass?: string;
  radius?: string;
  imgUrl?: string;
  userName?: string;
  hasChecked?: boolean;
  hasCheckedClass?: string;
  saturation?: number;
  lightness?: number;
  width?: number;
}

const Avatar: FC<AvatarProps> = ({
  containerClassName = "ring-1 ring-white dark:ring-neutral-900",
  sizeClass = "h-6 w-6 text-sm",
  radius = "rounded-full",
  imgUrl = "",
  userName = "Kevin",
  saturation = 0.5,
  lightness = 0.5,
  width = 32,
}) => {
  const svgURI = useMemo(
    () =>
      "data:image/svg+xml;utf8," +
      encodeURIComponent(minidenticon(userName, saturation, lightness)),
    [userName, saturation, lightness]
  );

  const url = imgUrl || "";
  const name = userName || "John Doe";
  const _setBgColor = (name: string) => {
    const backgroundIndex = Math.floor(
      name.charCodeAt(0) % avatarColors.length
    );
    return avatarColors[backgroundIndex];
  };

  return (
    <div
      className={`relative flex-shrink-0 inline-flex items-center justify-center text-neutral-100 uppercase font-semibold shadow-inner ${radius} ${sizeClass} ${containerClassName}`}
      style={{
        backgroundColor: url ? undefined : _setBgColor(name),
        width,
        height: width,
      }}
    >
      {url ? (
        <img
          className={`absolute inset-0 w-full h-full object-cover ${radius}`}
          src={url}
          alt={name}
        />
      ) : (
        <img
          src={svgURI}
          className={`absolute inset-0 w-full h-full object-cover ${radius}`}
          alt={userName}
        />
      )}
    </div>
  );
};

export default Avatar;
