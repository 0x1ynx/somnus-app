// Login.js — magic link login screen

import { supabase } from '../services/supabase.js';

export function renderLogin(app) {
  const page = document.createElement('div');
  page.className = 'page';
  page.style.cssText = 'display:flex; align-items:center; justify-content:center;';

  page.innerHTML = `
    <div style="width:100%; max-width:340px; padding:40px 24px; text-align:center;">
      <div style="font-size:64px; margin-bottom:16px;">🌙</div>
      <h1 style="font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:400;
                 color:#e8e0ff; margin:0 0 8px;">Somnus</h1>
      <p style="color:rgba(255,255,255,0.5); font-size:0.9rem; margin:0 0 40px;">
        Your dream journal
      </p>

      <div class="form-group" style="text-align:left;">
        <div class="input-label" style="color:rgba(255,255,255,0.7);">Email</div>
        <input
          type="email"
          id="login-email"
          class="date-input"
          placeholder="your@email.com"
          style="width:100%; box-sizing:border-box; color:#fff; background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.15);"
        />
      </div>

      <button class="save-btn" id="login-btn" style="width:100%; margin-top:8px;">
        <span class="save-icon">✨</span> Send Magic Link
      </button>

      <div id="login-status" style="margin-top:20px; font-size:0.85rem; color:rgba(255,255,255,0.6);"></div>
    </div>
  `;

  app.innerHTML = '';
  app.appendChild(page);

  const emailInput = page.querySelector('#login-email');
  const loginBtn = page.querySelector('#login-btn');
  const status = page.querySelector('#login-status');

  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!email) {
      emailInput.classList.add('shake');
      setTimeout(() => emailInput.classList.remove('shake'), 500);
      return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="save-icon">⏳</span> Sending...';

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      status.textContent = '❌ ' + error.message;
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<span class="save-icon">✨</span> Send Magic Link';
    } else {
      loginBtn.innerHTML = '<span class="save-icon">📬</span> Link sent!';
      status.innerHTML = `Check your inbox at <strong>${email}</strong><br>Click the link to sign in.`;
    }
  });

  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });
}
