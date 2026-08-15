!macro customUnInstall
  ${ifNot} ${isUpdated}
    ; StarCanvas使用自定义 Electron userData 目录，升级过程不得删除。
    RMDir /r "$APPDATA\wanjuan-ai-canvas-desktop-test"
  ${endIf}
!macroend
