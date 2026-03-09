(function () {
  if (window.RisoonChatWidget) return;

  window.RisoonChatWidget = {
    initialized: false,
    config: {},
    elements: {},
    state: {
      isOpen: false,
      quickActionsUsed: false
    },

    init: function (config) {
      this.config = Object.assign({
        webhookUrl: "",
        brandName: "ريسون",
        assistantName: "مساعد ريسون",
        accentColor: "#2f6f57",
        accentColorSoft: "#eef7f3",
        position: "right",
        rtl: true,
        launcherId: "risoon-chat-launcher",
        showQuickActions: true
      }, config || {});

      if (this.initialized) {
        this.toggle();
        return;
      }

      this.injectStyles();
      this.createUI();
      this.bindEvents();
      this.handleResponsive();
      window.addEventListener("resize", this.handleResponsive.bind(this));

      this.initialized = true;
      this.open();
    },

    injectStyles: function () {
      if (document.getElementById("risoon-chat-styles")) return;

      var style = document.createElement("style");
      style.id = "risoon-chat-styles";
      style.textContent = `
        .risoon-chat-widget, .risoon-chat-widget * {
          box-sizing: border-box;
          font-family: Tahoma, Arial, sans-serif;
        }

        .risoon-chat-widget {
          position: fixed;
          bottom: 90px;
          right: 18px;
          width: 380px;
          max-width: calc(100vw - 24px);
          height: 620px;
          max-height: calc(100vh - 120px);
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 24px;
          box-shadow: 0 24px 60px rgba(15,23,42,0.18);
          overflow: hidden;
          z-index: 999999;
          display: none;
          flex-direction: column;
          direction: rtl;
          transform: translateY(12px) scale(.98);
          opacity: 0;
          transition: opacity .22s ease, transform .22s ease;
        }

        .risoon-chat-widget.open {
          display: flex;
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .risoon-chat-header {
          padding: 16px;
          background: linear-gradient(135deg, #2f6f57 0%, #3f8b6d 100%);
          color: #fff;
        }

        .risoon-chat-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .risoon-chat-agent {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .risoon-chat-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(255,255,255,.18);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          backdrop-filter: blur(6px);
        }

        .risoon-chat-agent-name {
          font-size: 15px;
          font-weight: 700;
          line-height: 1.4;
        }

        .risoon-chat-agent-status {
          font-size: 12px;
          opacity: .92;
          margin-top: 2px;
        }

        .risoon-chat-close {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 12px;
          background: rgba(255,255,255,.14);
          color: #fff;
          cursor: pointer;
          font-size: 18px;
        }

        .risoon-chat-subtitle {
          margin-top: 12px;
          background: rgba(255,255,255,.12);
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 16px;
          padding: 10px 12px;
          font-size: 12px;
          line-height: 1.8;
        }

        .risoon-chat-messages {
          flex: 1;
          overflow-y: auto;
          background:
            radial-gradient(circle at top right, rgba(47,111,87,.05), transparent 28%),
            #f8faf9;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          scroll-behavior: smooth;
        }

        .risoon-chat-bubble {
          max-width: 85%;
          padding: 11px 13px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.9;
          word-break: break-word;
          white-space: pre-wrap;
        }

        .risoon-chat-bubble.bot {
          align-self: flex-start;
          background: #fff;
          color: #111827;
          border: 1px solid rgba(15,23,42,.08);
          border-top-right-radius: 6px;
          box-shadow: 0 8px 18px rgba(15,23,42,.04);
        }

        .risoon-chat-bubble.user {
          align-self: flex-end;
          background: linear-gradient(135deg, #2f6f57 0%, #3f8b6d 100%);
          color: #fff;
          border-top-left-radius: 6px;
          box-shadow: 0 10px 22px rgba(47,111,87,.18);
        }

        .risoon-chat-quick-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 2px;
          margin-bottom: 4px;
        }

        .risoon-chat-chip {
          border: 1px solid rgba(47,111,87,.16);
          background: #fff;
          color: #2f6f57;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          cursor: pointer;
          transition: all .2s ease;
        }

        .risoon-chat-chip:hover {
          background: #eef7f3;
        }

        .risoon-chat-footer {
          border-top: 1px solid rgba(15,23,42,.08);
          background: #fff;
          padding: 12px;
        }

        .risoon-chat-input-wrap {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }

        .risoon-chat-send {
          min-width: 74px;
          height: 46px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #2f6f57 0%, #3f8b6d 100%);
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(47,111,87,.18);
        }

        .risoon-chat-input {
          flex: 1;
          resize: none;
          min-height: 46px;
          max-height: 120px;
          border: 1px solid rgba(15,23,42,.12);
          border-radius: 14px;
          padding: 12px 14px;
          outline: none;
          background: #fff;
          color: #111827;
          font-size: 14px;
          line-height: 1.8;
          direction: rtl;
          text-align: right;
        }

        .risoon-chat-input:focus {
          border-color: rgba(47,111,87,.45);
          box-shadow: 0 0 0 4px rgba(47,111,87,.08);
        }

        .risoon-chat-note {
          margin-top: 8px;
          font-size: 11px;
          color: #6b7280;
          text-align: center;
        }

        .risoon-chat-typing {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .risoon-chat-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #9ca3af;
          animation: risoonTyping 1.2s infinite ease-in-out;
        }

        .risoon-chat-dot:nth-child(2) { animation-delay: .15s; }
        .risoon-chat-dot:nth-child(3) { animation-delay: .3s; }

        @keyframes risoonTyping {
          0%, 80%, 100% { transform: scale(.7); opacity: .45; }
          40% { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 640px) {
          .risoon-chat-widget {
            right: 12px;
            left: 12px;
            width: auto;
            height: 72vh;
            max-height: none;
            bottom: 84px;
            border-radius: 20px;
          }
        }
      `;
      document.head.appendChild(style);
    },

    createUI: function () {
      var panel = document.createElement("div");
      panel.className = "risoon-chat-widget";
      panel.innerHTML = `
        <div class="risoon-chat-header">
          <div class="risoon-chat-header-top">
            <div class="risoon-chat-agent">
              <div class="risoon-chat-avatar">💡</div>
              <div>
                <div class="risoon-chat-agent-name">${this.escapeHtml(this.config.assistantName)}</div>
                <div class="risoon-chat-agent-status">متصل الآن  </div>
              </div>
            </div>
            <button class="risoon-chat-close" type="button" aria-label="إغلاق">×</button>
          </div>
          <div class="risoon-chat-subtitle">
            أهلًا بك في ${this.escapeHtml(this.config.brandName)} ✨<br>
            اسأل عن المنتجات، الطلبات، أو المساعدة في اختيار الإضاءة المناسبة.
          </div>
        </div>

        <div class="risoon-chat-messages" id="risoon-chat-messages"></div>

        <div class="risoon-chat-footer">
          <div class="risoon-chat-input-wrap">
            <button class="risoon-chat-send" type="button">إرسال</button>
            <textarea class="risoon-chat-input" rows="1" placeholder="اكتب رسالتك هنا..."></textarea>
          </div>
          <div class="risoon-chat-note">بالضغط على إرسال، يبدأ مساعد ريسون في الرد عليك داخل الموقع.</div>
        </div>
      `;

      document.body.appendChild(panel);

      this.elements.panel = panel;
      this.elements.messages = panel.querySelector("#risoon-chat-messages");
      this.elements.close = panel.querySelector(".risoon-chat-close");
      this.elements.send = panel.querySelector(".risoon-chat-send");
      this.elements.input = panel.querySelector(".risoon-chat-input");
      this.elements.launcher = document.getElementById(this.config.launcherId);

      this.appendBotMessage("أهلًا بك في " + this.config.brandName + " ✨\nكيف أقدر أساعدك اليوم؟");

      if (this.config.showQuickActions) {
        this.renderQuickActions();
      }
    },

    renderQuickActions: function () {
      if (this.state.quickActionsUsed) return;

      var wrap = document.createElement("div");
      wrap.className = "risoon-chat-quick-actions";
      wrap.innerHTML = `
        <button type="button" class="risoon-chat-chip" data-message="أريد المساعدة في اختيار منتج مناسب">اختيار منتج</button>
        <button type="button" class="risoon-chat-chip" data-message="أريد تتبع طلبي">تتبع الطلب</button>
        <button type="button" class="risoon-chat-chip" data-message="ما هي أفضل المنتجات للمجلس؟">اقتراحات للمجلس</button>
      `;

      this.elements.messages.appendChild(wrap);

      var self = this;
      wrap.querySelectorAll(".risoon-chat-chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
          self.state.quickActionsUsed = true;
          wrap.remove();
          self.sendPreparedMessage(chip.getAttribute("data-message"));
        });
      });

      this.scrollToBottom();
    },

    bindEvents: function () {
      var self = this;

      this.elements.close.addEventListener("click", function () {
        self.close();
      });

      this.elements.send.addEventListener("click", function () {
        self.sendMessage();
      });

      this.elements.input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          self.sendMessage();
        }
      });

      this.elements.input.addEventListener("input", function () {
        self.autoResize();
      });
    },

    autoResize: function () {
      var input = this.elements.input;
      input.style.height = "46px";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    },

    open: function () {
      this.state.isOpen = true;
      this.elements.panel.style.display = "flex";
      requestAnimationFrame(() => {
        this.elements.panel.classList.add("open");
      });
      this.scrollToBottom();
      setTimeout(() => this.elements.input.focus(), 100);
    },

    close: function () {
      this.state.isOpen = false;
      this.elements.panel.classList.remove("open");
      setTimeout(() => {
        if (!this.state.isOpen) this.elements.panel.style.display = "none";
      }, 220);
    },

    toggle: function () {
      if (this.state.isOpen) this.close();
      else this.open();
    },

    handleResponsive: function () {
      if (!this.elements.panel) return;
      if (window.innerWidth > 640) {
        this.elements.panel.style.left = "";
        this.elements.panel.style.right = "18px";
      }
    },

    appendBubble: function (sender, html, isHtml) {
      var bubble = document.createElement("div");
      bubble.className = "risoon-chat-bubble " + sender;
      bubble.innerHTML = isHtml ? html : this.escapeHtml(html).replace(/\n/g, "<br>");
      this.elements.messages.appendChild(bubble);
      this.scrollToBottom();
      return bubble;
    },

    appendBotMessage: function (text) {
      return this.appendBubble("bot", text, false);
    },

    appendUserMessage: function (text) {
      return this.appendBubble("user", text, false);
    },

    appendTyping: function () {
      return this.appendBubble(
        "bot",
        '<span class="risoon-chat-typing"><span class="risoon-chat-dot"></span><span class="risoon-chat-dot"></span><span class="risoon-chat-dot"></span></span>',
        true
      );
    },

    scrollToBottom: function () {
      this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    },

    sendPreparedMessage: function (text) {
      this.elements.input.value = text;
      this.sendMessage();
    },

    sendMessage: async function () {
      var text = this.elements.input.value.trim();
      if (!text) return;

      this.appendUserMessage(text);
      this.elements.input.value = "";
      this.autoResize();

      var typing = this.appendTyping();

      try {
        var response = await fetch(this.config.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: text,
            store_domain: this.config.storeDomain || "",
            store_id: this.config.storeId || "",
            customer_id: this.config.customerId || "",
            customer_name: this.config.customerName || "",
            customer_email: this.config.customerEmail || "",
            customer_mobile: this.config.customerMobile || "",
            page_url: window.location.href
          })
        });

        var data = await response.json();
        typing.remove();
        this.appendBotMessage(data.reply || "عذرًا، لم أتمكن من الرد الآن.");
      } catch (e) {
        typing.remove();
        this.appendBotMessage("تعذر الاتصال بالخدمة الآن. حاول مرة أخرى بعد قليل.");
      }
    },

    escapeHtml: function (str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  };
})();