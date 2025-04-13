// 기본 프리셋 값
const DEFAULT_PRESETS = [
  { width: 1024, height: 1024, label: '1024×1024' },
  { width: 896,  height: 1152, label: '896×1152' },
  { width: 832,  height: 1216, label: '832×1216' },
  { width: 768,  height: 1280, label: '768×1280' },
  { width: 512,  height: 1920, label: '512×1920' }
];

document.addEventListener('DOMContentLoaded', () => {
  const addButton       = document.getElementById('add-button');
  const saveButton      = document.getElementById('save-button');
  const resetButton     = document.getElementById('reset-button');
  const statusMessage   = document.getElementById('status-message');
  const presetsContainer = document.getElementById('presets-container');

  // ──────────────── 유틸 ────────────────
  const showStatus = (msg, error = false) => {
    statusMessage.textContent = msg;
    statusMessage.className   = error ? 'error' : 'success';
    setTimeout(() => { statusMessage.textContent = ''; statusMessage.className=''; }, 3000);
  };

  const refreshLabels = () => {
    [...presetsContainer.children].forEach((row, i) =>
      row.querySelector('.preset-label').textContent = `Preset ${i+1}:`
    );
  };

  // ───────────── 프리셋 행 생성 ─────────────
  function createPresetRow(preset = { width: '', height: '' }) {
    const row = document.createElement('div');
    row.className = 'preset-item';
    row.innerHTML = `
      <div class="preset-label"></div>
      <div class="preset-inputs">
        <input type="number" class="preset-width"  placeholder="W" min="64" step="64" value="${preset.width}">
        <span>×</span>
        <input type="number" class="preset-height" placeholder="H" min="64" step="64" value="${preset.height}">
        <button class="delete-button" title="Delete">×</button>
      </div>`;
    // 삭제
    row.querySelector('.delete-button').addEventListener('click', () => {
      if (presetsContainer.children.length === 1) {
        showStatus('At least 1 preset needed.', true);
        return;
      }
      row.remove();
      refreshLabels();
    });
    presetsContainer.appendChild(row);
    refreshLabels();
  }

  // ───────────── 저장/불러오기 ─────────────
  const loadPresets = () => {
    chrome.storage.sync.get('naiPresets', ({ naiPresets }) => {
      const presets = naiPresets || DEFAULT_PRESETS;
      presetsContainer.innerHTML = '';
      presets.forEach(p => createPresetRow(p));
    });
  };

  const savePresets = () => {
    const rows    = [...presetsContainer.querySelectorAll('.preset-item')];
    const presets = [];

    for (const [i,row] of rows.entries()) {
      const width  = parseInt(row.querySelector('.preset-width').value);
      const height = parseInt(row.querySelector('.preset-height').value);
      if (isNaN(width) || isNaN(height) || width < 64 || height < 64) {
        showStatus(`Preset ${i+1} value error. Must be larger than 64.`, true); return;
      }
      presets.push({ width, height, label: `${width}×${height}` });
    }

    chrome.storage.sync.set({ naiPresets: presets }, () => {
      if (chrome.runtime.lastError) {
        showStatus('Save error: ' + chrome.runtime.lastError.message, true);
      } else {
        showStatus('Saved! Refresh the page.');
      }
    });
  };

  const resetToDefaults = () => {
    chrome.storage.sync.remove('naiPresets', () => {
      loadPresets();
      showStatus('Reset done! Refresh the page.');
    });
  };

  // ───────────── 이벤트 바인딩 ─────────────
  addButton .addEventListener('click', () => createPresetRow());
  saveButton.addEventListener('click', savePresets);
  resetButton.addEventListener('click', resetToDefaults);

  loadPresets();   // 최초 로드
});
