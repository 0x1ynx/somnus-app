// Login.js — email OTP login (6-digit code, no redirect needed)

import { supabase } from '../services/supabase.js';

export function renderLogin(app) {
  renderEmailStep(app);
}

function renderEmailStep(app) {
  app.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      box-sizing: border-box;
      font-family: Inter, sans-serif;
    ">
      <div style="width: 100%; max-width: 320px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="font-size: 56px; margin-bottom: 12px;">🌙</div>
          <h1 style="
            font-family: 'Cormorant Garamond', serif;
            font-size: 2rem;
            font-weight: 400;
            color: #e8e0ff;
            margin: 0 0 6px;
          ">Somnus</h1>
          <p style="color: rgba(255,255,255,0.45); font-size: 0.875rem; margin: 0;">
            Your dream journal
          </p>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="
            display: block;
            color: rgba(255,255,255,0.6);
            font-size: 0.75rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 8px;
          ">Email</label>
          <input
            type="email"
            id="login-email"
            placeholder="your@email.com"
            style="
              width: 100%;
              box-sizing: border-box;
              padding: 12px 16px;
              background: rgba(255,255,255,0.07);
              border: 1px solid rgba(255,255,255,0.15);
              border-radius: 12px;
              color: #fff;
              font-size: 1rem;
              font-family: Inter, sans-serif;
              outline: none;
            "
          />
        </div>

        <button id="login-btn" style="
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 0.95rem;
          font-family: Inter, sans-serif;
          font-weight: 500;
          cursor: pointer;
          margin-top: 4px;
        ">✨ Send Code</button>

        <div id="login-status" style="
          margin-top: 16px;
          text-align: center;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.5);
          min-height: 20px;
        "></div>
      </div>
    </div>
  `;

  const emailInput = app.querySelector('#login-email');
  const loginBtn = app.querySelector('#login-btn');
  const status = app.querySelector('#login-status');

  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!email) {
      emailInput.style.borderColor = '#f87171';
      setTimeout(() => emailInput.style.borderColor = 'rgba(255,255,255,0.15)', 1500);
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = '⏳ Sending...';

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      status.style.color = '#f87171';
      status.textContent = '❌ ' + error.message;
      loginBtn.disabled = false;
      loginBtn.textContent = '✨ Send Code';
    } else {
      renderCodeStep(app, email);
    }
  });

  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });
}

function renderCodeStep(app, email) {
  app.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      box-sizing: border-box;
      font-family: Inter, sans-serif;
    ">
      <div style="width: 100%; max-width: 320px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="font-size: 56px; margin-bottom: 12px;">📬</div>
          <h1 style="
            font-family: 'Cormorant Garamond', serif;
            font-size: 1.6rem;
            font-weight: 400;
            color: #e8e0ff;
            margin: 0 0 8px;
          ">Check your inbox</h1>
          <p style="color: rgba(255,255,255,0.45); font-size: 0.875rem; margin: 0;">
            We sent a login code to<br>
            <span style="color:rgba(255,255,255,0.7);">${email}</span>
          </p>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="
            display: block;
            color: rgba(255,255,255,0.6);
            font-size: 0.75rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 8px;
          ">Login code</label>
          <input
            type="number"
            id="otp-input"
            placeholder="12345678"
            maxlength="8"
            style="
              width: 100%;
              box-sizing: border-box;
              padding: 12px 16px;
              background: rgba(255,255,255,0.07);
              border: 1px solid rgba(255,255,255,0.15);
              border-radius: 12px;
              color: #fff;
              font-size: 1.4rem;
              font-family: Inter, sans-serif;
              outline: none;
              letter-spacing: 0.3em;
              text-align: center;
            "
          />
        </div>

        <button id="verify-btn" style="
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 0.95rem;
          font-family: Inter, sans-serif;
          font-weight: 500;
          cursor: pointer;
          margin-top: 4px;
        ">🌙 Enter Somnus</button>

        <button id="back-btn" style="
          width: 100%;
          padding: 10px;
          background: none;
          border: none;
          color: rgba(255,255,255,0.35);
          font-size: 0.85rem;
          font-family: Inter, sans-serif;
          cursor: pointer;
          margin-top: 8px;
        ">← Use a different email</button>

        <div id="verify-status" style="
          margin-top: 16px;
          text-align: center;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.5);
          min-height: 20px;
        "></div>
      </div>
    </div>
  `;

  const otpInput = app.querySelector('#otp-input');
  const verifyBtn = app.querySelector('#verify-btn');
  const status = app.querySelector('#verify-status');

  otpInput.focus();

  verifyBtn.addEventListener('click', async () => {
    const token = otpInput.value.trim();
    if (token.length < 4) {
      otpInput.style.borderColor = '#f87171';
      setTimeout(() => otpInput.style.borderColor = 'rgba(255,255,255,0.15)', 1500);
      return;
    }

    verifyBtn.disabled = true;
    verifyBtn.textContent = '⏳ Verifying...';

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      status.style.color = '#f87171';
      status.textContent = '❌ Wrong code, try again';
      verifyBtn.disabled = false;
      verifyBtn.textContent = '🌙 Enter Somnus';
    }
    // On success, onAuthStateChange in main.js will fire and route to the app
  });

  otpInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifyBtn.click();
  });

  app.querySelector('#back-btn').addEventListener('click', () => {
    renderEmailStep(app);
  });
}
