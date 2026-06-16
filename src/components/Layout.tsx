/**
 * Layout 组件
 * 职责：应用主布局，管理页面路由和全局组件挂载
 * 模块：components
 */

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { ChatView } from "./ChatView";
import { RightPanel } from "./RightPanel";
import { KnowledgeBase } from "../pages/KnowledgeBase";
import { Reports } from "../pages/Reports";
import { Settings } from "../pages/Settings";
import { SplashScreen } from "./SplashScreen";
import { DisclaimerModal } from "./DisclaimerModal";
import type { PageType } from "../types";

export function Layout() {
  const [activePage, setActivePage] = useState<PageType>("chat");
  const [isReady, setIsReady] = useState(false);

  if (!isReady) {
    return <SplashScreen onComplete={() => setIsReady(true)} />;
  }

  const renderContent = () => {
    switch (activePage) {
      case "chat":
        return <ChatView />;
      case "knowledge":
        return <KnowledgeBase />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
    }
  };

  return (
    <>
      <DisclaimerModal onAccept={() => {}} />
      <div className="h-screen flex bg-bg-primary animate-fade-in">
        <Sidebar activePage={activePage} onPageChange={setActivePage} />
        {renderContent()}
        {activePage === "chat" && <RightPanel />}
      </div>
    </>
  );
}
