(function () {
  var root = document.querySelector('#root');
  if (root && root.innerHTML === '') {
    root.innerHTML = (
      ' \n' +
      '  <style>\n' +
      '    html,\n' +
      '    body,\n' +
      '    #root {\n' +
      '      height: 100%;\n' +
      '      margin: 0;\n' +
      '      padding: 0;\n' +
      '    }\n' +
      '    #root {\n' +
      '      background-repeat: no-repeat;\n' +
      '      background-size: 100% auto;\n' +
      '    }\n' +
      '    .loading-title {\n' +
      '      font-size: 1.1rem;\n' +
      '    }\n' +
      '    .loading-sub-title {\n' +
      '      margin-top: 20px;\n' +
      '      font-size: 1rem;\n' +
      '      color: #888;\n' +
      '    }\n' +
      '    .page-loading-warp {\n' +
      '      display: flex;\n' +
      '      align-items: center;\n' +
      '      justify-content: center;\n' +
      '      padding: 26px;\n' +
      '    }\n' +
      '    .ant-spin {\n' +
      '      position: absolute;\n' +
      '      display: none;\n' +
      '      box-sizing: border-box;\n' +
      '      margin: 0;\n' +
      '      padding: 0;\n' +
      '      color: #1890ff;\n' +
      '      font-size: 14px;\n' +
      '      line-height: 1.5;\n' +
      '      text-align: center;\n' +
      '      opacity: 0;\n' +
      '      transition: transform 0.3s cubic-bezier(0.78, 0.14, 0.15, 0.86);\n' +
      '      font-feature-settings: "tnum";\n' +
      '    }\n' +
      '    .ant-spin-spinning {\n' +
      '      position: static;\n' +
      '      display: inline-block;\n' +
      '      opacity: 1;\n' +
      '    }\n' +
      '    .ant-spin-dot {\n' +
      '      position: relative;\n' +
      '      display: inline-block;\n' +
      '      width: 20px;\n' +
      '      height: 20px;\n' +
      '      font-size: 20px;\n' +
      '    }\n' +
      '    .ant-spin-dot-item {\n' +
      '      position: absolute;\n' +
      '      display: block;\n' +
      '      width: 9px;\n' +
      '      height: 9px;\n' +
      '      background-color: #1890ff;\n' +
      '      border-radius: 100%;\n' +
      '      transform: scale(0.75);\n' +
      '      transform-origin: 50% 50%;\n' +
      '      opacity: 0.3;\n' +
      '      animation: antSpinMove 1s infinite linear alternate;\n' +
      '    }\n' +
      '    .ant-spin-dot-item:nth-child(1) {\n' +
      '      top: 0;\n' +
      '      left: 0;\n' +
      '    }\n' +
      '    .ant-spin-dot-item:nth-child(2) {\n' +
      '      top: 0;\n' +
      '      right: 0;\n' +
      '      animation-delay: 0.4s;\n' +
      '    }\n' +
      '    .ant-spin-dot-item:nth-child(3) {\n' +
      '      right: 0;\n' +
      '      bottom: 0;\n' +
      '      animation-delay: 0.8s;\n' +
      '    }\n' +
      '    .ant-spin-dot-item:nth-child(4) {\n' +
      '      bottom: 0;\n' +
      '      left: 0;\n' +
      '      animation-delay: 1.2s;\n' +
      '    }\n' +
      '    .ant-spin-dot-spin {\n' +
      '      transform: rotate(45deg);\n' +
      '      animation: antRotate 1.2s infinite linear;\n' +
      '    }\n' +
      '    .ant-spin-lg .ant-spin-dot {\n' +
      '      width: 32px;\n' +
      '      height: 32px;\n' +
      '      font-size: 32px;\n' +
      '    }\n' +
      '    .ant-spin-lg .ant-spin-dot i {\n' +
      '      width: 14px;\n' +
      '      height: 14px;\n' +
      '    }\n' +
      '    @keyframes antSpinMove {\n' +
      '      to { opacity: 1; }\n' +
      '    }\n' +
      '    @keyframes antRotate {\n' +
      '      to { transform: rotate(405deg); }\n' +
      '    }\n' +
      '  </style>\n' +
      '  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:362px;">\n' +
      '    <div class="page-loading-warp">\n' +
      '      <div class="ant-spin ant-spin-lg ant-spin-spinning">\n' +
      '        <span class="ant-spin-dot ant-spin-dot-spin">\n' +
      '          <i class="ant-spin-dot-item"></i>\n' +
      '          <i class="ant-spin-dot-item"></i>\n' +
      '          <i class="ant-spin-dot-item"></i>\n' +
      '          <i class="ant-spin-dot-item"></i>\n' +
      '        </span>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '    <div class="loading-title">正在加载资源</div>\n' +
      '    <div class="loading-sub-title">初次加载资源可能需要较多时间 请耐心等待</div>\n' +
      '  </div>\n'
    );
  }
})();

