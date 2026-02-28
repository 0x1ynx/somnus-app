// Login.js — magic link login screen

import { supabase } from '../services/supabase.js';

export function renderLogin(app) {
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
        ">✨ Send Magic Link</button>

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
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      status.style.color = '#f87171';
      status.textContent = '❌ ' + error.message;
      loginBtn.disabled = false;
      loginBtn.textContent = '✨ Send Magic Link';
    } else {
      loginBtn.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
      loginBtn.textContent = '📬 Link sent!';
      status.textContent = `Check your inbox — click the link to sign in.`;
    }
  });

  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });
}
