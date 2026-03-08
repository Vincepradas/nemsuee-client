import { useEffect } from "react";

export function useActionIconizer() {
  useEffect(() => {
    const iconForAction = (label: string) => {
      const text = label.toLowerCase();
      if (text.includes("new key") || text.includes("generate key"))
        return "generate";
      if (text.includes("key")) return "key";
      if (text.includes("refresh") || text.includes("sync")) return "refresh";
      if (text.includes("search") || text.includes("find")) return "search";
      if (text.includes("save")) return "save";
      if (text.includes("submit")) return "send";
      if (
        text.includes("add") ||
        text.includes("create") ||
        text.includes("new")
      )
        return "plus";
      if (text.includes("edit") || text.includes("update")) return "edit";
      if (text.includes("delete") || text.includes("remove")) return "trash";
      if (text.includes("close") || text.includes("cancel")) return "close";
      if (text.includes("upload")) return "upload";
      if (text.includes("download")) return "download";
      if (text.includes("link") || text.includes("connect")) return "link";
      if (text.includes("disconnect")) return "unlink";
      if (text.includes("archive")) return "archive";
      if (text.includes("leave")) return "exit";
      if (text.includes("logout")) return "logout";
      if (text === "prev" || text.includes("previous")) return "left";
      if (text === "next") return "right";
      return null;
    };

    const makeIcon = (kind: string) => {
      const ns = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(ns, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "1.9");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      svg.setAttribute("class", "h-4 w-4");

      const addPath = (d: string) => {
        const path = document.createElementNS(ns, "path");
        path.setAttribute("d", d);
        svg.appendChild(path);
      };

      if (kind === "refresh") addPath("M21 12a9 9 0 1 1-3.2-6.9M21 4v6h-6");
      if (kind === "key")
        addPath("M14 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 0l7 7m-3-1v3m-3-3v3");
      if (kind === "generate")
        addPath(
          "M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z",
        );
      if (kind === "search")
        addPath("M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z");
      if (kind === "save") addPath("M5 3h11l3 3v15H5zM8 3v6h8V3M9 21v-7h6v7");
      if (kind === "send") addPath("M22 2L11 13M22 2l-7 20-4-9-9-4z");
      if (kind === "plus") addPath("M12 5v14M5 12h14");
      if (kind === "edit") addPath("M4 20h4l10-10-4-4L4 16v4zM13 5l4 4");
      if (kind === "trash")
        addPath("M3 6h18M8 6V4h8v2M7 6l1 14h8l1-14M10 10v6M14 10v6");
      if (kind === "close") addPath("M6 6l12 12M18 6L6 18");
      if (kind === "upload") addPath("M12 16V4M7 9l5-5 5 5M4 20h16");
      if (kind === "download") addPath("M12 4v12M7 11l5 5 5-5M4 20h16");
      if (kind === "link")
        addPath(
          "M10 14l-2 2a4 4 0 1 1-6-6l3-3a4 4 0 0 1 6 0M14 10l2-2a4 4 0 1 1 6 6l-3 3a4 4 0 0 1-6 0M8 12h8",
        );
      if (kind === "unlink")
        addPath(
          "M10 14l-2 2a4 4 0 1 1-6-6l3-3a4 4 0 0 1 6 0M14 10l2-2a4 4 0 1 1 6 6l-3 3a4 4 0 0 1-6 0M9 15l6-6",
        );
      if (kind === "archive") addPath("M3 7h18v4H3zM5 11v9h14v-9M10 15h4");
      if (kind === "exit" || kind === "logout")
        addPath("M10 17l5-5-5-5M15 12H3M20 4v16");
      if (kind === "left") addPath("M15 18l-6-6 6-6");
      if (kind === "right") addPath("M9 18l6-6-6-6");
      return svg;
    };

    const iconizeActionButtons = () => {
      const buttons = document.querySelectorAll("button");
      buttons.forEach((button) => {
        if (button.dataset.actionIconized === "true") return;
        if (button.querySelector("svg, img")) return;
        const onlyTextNodes = Array.from(button.childNodes).every(
          (node) => node.nodeType === Node.TEXT_NODE,
        );
        if (!onlyTextNodes) return;
        if (button.dataset.keepActionText === "true") return;
        const label = button.textContent?.replace(/\s+/g, " ").trim() || "";
        if (!label) return;
        const iconKind = iconForAction(label);
        if (!iconKind) return;
        button.dataset.actionIconized = "true";
        button.setAttribute(
          "aria-label",
          button.getAttribute("aria-label") || label,
        );
        button.setAttribute("title", button.getAttribute("title") || label);
        button.classList.remove(
          "w-full",
          "text-left",
          "px-3",
          "py-2",
          "text-sm",
          "text-xs",
          "font-medium",
        );
        button.classList.add("p-2");
        button.textContent = "";
        button.appendChild(makeIcon(iconKind));
      });
    };

    iconizeActionButtons();
    const observer = new MutationObserver(() => iconizeActionButtons());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, []);
}
