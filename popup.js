// 기본 프리셋 값
const DEFAULT_PRESETS = [
  { width: 1024, height: 1024, label: '1024×1024' },
    { width: 896, height: 1152, label: '896x1152' },
    { width: 832, height: 1216, label: '832×1216' },
    { width: 768, height: 1280, label: '768×1280' },
    { width: 512, height: 1920, label: '512×1920' }
  ];
  
  // DOM 요소 가져오기
  document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('save-button');
    const resetButton = document.getElementById('reset-button');
    const statusMessage = document.getElementById('status-message');
    
    // 저장된 프리셋 불러오기
    loadPresets();
    
    // 저장 버튼 클릭 이벤트
    saveButton.addEventListener('click', () => {
      savePresets();
    });
    
    // 재설정 버튼 클릭 이벤트
    resetButton.addEventListener('click', () => {
      resetToDefaults();
    });
    
    // 상태 메시지 표시 함수
    function showStatus(message, isError = false) {
      statusMessage.textContent = message;
      statusMessage.className = isError ? 'error' : 'success';
      
      // 3초 후 메시지 숨기기
      setTimeout(() => {
        statusMessage.textContent = '';
        statusMessage.className = '';
      }, 3000);
    }
    
    // 저장된 프리셋 불러오기
    function loadPresets() {
      chrome.storage.sync.get('naiPresets', (data) => {
        const presets = data.naiPresets || DEFAULT_PRESETS;
        
        for (let i = 0; i < 5; i++) {
          const preset = presets[i] || DEFAULT_PRESETS[i];
          document.getElementById(`preset${i+1}-width`).value = preset.width;
          document.getElementById(`preset${i+1}-height`).value = preset.height;
        }
      });
    }
    
    // 프리셋 저장하기
    function savePresets() {
      const presets = [];
      
      for (let i = 1; i <= 5; i++) {
        const width = parseInt(document.getElementById(`preset${i}-width`).value);
        const height = parseInt(document.getElementById(`preset${i}-height`).value);
        
        // 유효성 검사
        if (isNaN(width) || isNaN(height) || width < 64 || height < 64) {
          showStatus(`Preset ${i} value error. Must be larger than 64.`, true);
          return;
        }
        
        presets.push({
          width,
          height,
          label: `${width}×${height}`
        });
      }
      
      // 스토리지에 저장
      chrome.storage.sync.set({ naiPresets: presets }, () => {
        if (chrome.runtime.lastError) {
          showStatus('Error saving: ' + chrome.runtime.lastError.message, true);
        } else {
          showStatus('Preset saved! Please refresh the page.');
        }
      });
    }
    
    // 기본값으로 재설정
    function resetToDefaults() {
      // 스토리지에서 삭제
      chrome.storage.sync.remove('naiPresets', () => {
        // UI 업데이트
        for (let i = 0; i < 4; i++) {
          document.getElementById(`preset${i+1}-width`).value = DEFAULT_PRESETS[i].width;
          document.getElementById(`preset${i+1}-height`).value = DEFAULT_PRESETS[i].height;
        }
        
        showStatus('Preset reset done! Please refresh the page.');
      });
    }
  });
  