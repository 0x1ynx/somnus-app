// KeywordInput.js — tag-style keyword chip input (English)

export function createKeywordInput(initialKeywords, onChange) {
    const container = document.createElement('div');
    container.className = 'keyword-input-container';

    const label = document.createElement('div');
    label.className = 'input-label';
    label.textContent = 'Keywords';
    container.appendChild(label);

    const wrapper = document.createElement('div');
    wrapper.className = 'keyword-wrapper';

    const chipsArea = document.createElement('div');
    chipsArea.className = 'chips-area';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'keyword-text-input';
    input.placeholder = 'Type a keyword, press Enter to add...';

    let keywords = [...(initialKeywords || [])];

    function renderChips() {
        chipsArea.innerHTML = '';
        keywords.forEach((kw, i) => {
            const chip = document.createElement('span');
            chip.className = 'keyword-chip';
            chip.innerHTML = `
        ${kw}
        <button type="button" class="chip-remove" data-index="${i}">×</button>
      `;
            chip.querySelector('.chip-remove').addEventListener('click', () => {
                keywords.splice(i, 1);
                renderChips();
                onChange(keywords);
            });
            chipsArea.appendChild(chip);
        });
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.isComposing) {
            e.preventDefault();
            const val = input.value.trim();
            if (val && !keywords.includes(val)) {
                keywords.push(val);
                input.value = '';
                renderChips();
                onChange(keywords);
            }
        }
        if (e.key === 'Backspace' && !input.value && keywords.length > 0) {
            keywords.pop();
            renderChips();
            onChange(keywords);
        }
    });

    wrapper.appendChild(chipsArea);
    wrapper.appendChild(input);
    wrapper.addEventListener('click', () => input.focus());

    container.appendChild(wrapper);
    renderChips();
    return container;
}
