// Function to create and add the preset buttons
function addPresetButtons() {
    // Find all containers that might hold the dimension inputs (for both mobile and desktop)
    const selectContainers = document.querySelectorAll('.select.css-xnz0ry-container');
    
    if (selectContainers.length === 0) {
      // Retry after a short delay if elements aren't loaded yet
      setTimeout(addPresetButtons, 1000);
      return;
    }
    
    // Process each container
    selectContainers.forEach(selectContainer => {
      //   skip if selectContainer.parentNode has a child named id 'nai-dimension-presets'
      if (selectContainer.parentNode.parentNode.querySelector('#nai-dimension-presets')) {
        return;
      }

      if (selectContainer.parentNode.parentNode.id === 'promptChunkContainer') {
        return;
      }

      // Create a container for our preset buttons
      const presetContainer = document.createElement('div');
      presetContainer.id = 'nai-dimension-presets';
      presetContainer.className = 'nai-preset-container';
      
      // 기본 프리셋 값
      const DEFAULT_PRESETS = [
        { width: 832, height: 1216, label: '832×1216' },
        { width: 896, height: 1152, label: '896x1152' },
        { width: 768, height: 1280, label: '768×1280' },
        { width: 1024, height: 1024, label: '1024×1024' }
      ];
      
      // Get presets from storage or use defaults
      chrome.storage.sync.get('naiPresets', (data) => {
        // Define our presets (defaults if not found in storage)
        const presets = data.naiPresets || DEFAULT_PRESETS;
        
        // Create buttons for each preset
        presets.forEach(preset => {
          const button = document.createElement('button');
          button.className = 'nai-preset-button';
          button.textContent = preset.label;
          button.addEventListener('click', () => {
            // Find the closest dimension input container relative to this button
            const parentButton = button.closest('.nai-preset-container');
            setDimensionsNearElement(parentButton, preset.width, preset.height);
          });
          presetContainer.appendChild(button);
        });
        
        // Insert the preset container after the select container
      });
      selectContainer.parentNode.parentNode.insertBefore(presetContainer, selectContainer.parentNode);
    });
  }
  
  // Find and set dimensions for inputs near a specific element
  function setDimensionsNearElement(element, width, height) {
    // 다양한 방법으로 입력 필드 찾기 시도
    let inputsFound = false;
    
    // 방법 1: 가장 가까운 부모에서 flex row 스타일을 가진 컨테이너 찾기
    let currentNode = element;
    let maxAttempts = 5; // 최대 부모 검색 횟수 제한
    
    while (currentNode && maxAttempts > 0 && !inputsFound) {
      const flexContainers = currentNode.querySelectorAll('div[style*="display: flex; flex-direction: row;"]');
      
      for (const container of flexContainers) {
        const inputs = container.querySelectorAll('input[type="number"]');
        if (inputs.length >= 2) {
          processInputs(inputs, width, height);
          inputsFound = true;
          break;
        }
      }
      
      currentNode = currentNode.parentElement;
      maxAttempts--;
    }
    
    // 방법 2: 이전 방법이 실패했다면, 페이지 전체에서 입력 필드 찾기
    if (!inputsFound) {
      // 모든 step="64" 속성을 가진 숫자 입력 필드 찾기
      const allStepInputs = document.querySelectorAll('input[type="number"][step="64"]');
      
      // 두 개씩 그룹화하여 처리
      for (let i = 0; i < allStepInputs.length; i += 2) {
        if (i + 1 < allStepInputs.length) {
          const inputs = [allStepInputs[i], allStepInputs[i + 1]];
          processInputs(inputs, width, height);
          inputsFound = true;
        }
      }
    }
    
    // 방법 3: 클래스 이름으로 찾기
    if (!inputsFound) {
      const classInputs = document.querySelectorAll('input.hcJMLp');
      
      // 두 개씩 그룹화하여 처리
      for (let i = 0; i < classInputs.length; i += 2) {
        if (i + 1 < classInputs.length) {
          const inputs = [classInputs[i], classInputs[i + 1]];
          processInputs(inputs, width, height);
          inputsFound = true;
        }
      }
    }
    
    if (!inputsFound) {
      console.log('Could not find dimension inputs using any method');
    }
  }
  
  // Process a pair of input fields
  function processInputs(inputs, width, height) {
    if (inputs.length >= 2) {
      // 현재 입력된 값 확인
      const currentWidth = parseInt(inputs[0].value);
      const currentHeight = parseInt(inputs[1].value);
      
      // 타겟 값 결정 (이미 같은 값이면 가로/세로 바꾸기)
      let targetWidth = width;
      let targetHeight = height;
      
      if (currentWidth === width && currentHeight === height) {
        // 현재 값이 이미 버튼의 값과 동일하면 가로/세로 바꾸기
        targetWidth = height;
        targetHeight = width;
        console.log(`Same dimensions detected. Swapping to ${targetWidth}×${targetHeight}`);
      }
      
      // 값을 설정
      inputs[0].value = targetWidth;
      inputs[1].value = targetHeight;
      
      // 이벤트 발생
      for (const input of inputs) {
        ['input', 'change', 'blur'].forEach(eventType => {
          const event = new Event(eventType, { bubbles: true, cancelable: true });
          input.dispatchEvent(event);
        });
        
        if (typeof Event === 'function') {
          try {
            const reactChangeEvent = new Event('reactChange', { bubbles: true });
            input.dispatchEvent(reactChangeEvent);
          } catch (e) {
            console.log('React event dispatch failed', e);
          }
        }
      }
      
      console.log(`Set dimensions to ${targetWidth}×${targetHeight}`);
      
      // 값이 제대로 설정되었는지 확인
      setTimeout(() => {
        if (inputs[0].value != targetWidth || inputs[1].value != targetHeight) {
          console.log('Values did not persist, trying alternative method');
          directInputUpdate(inputs, targetWidth, targetHeight);
        }
      }, 100);
    }
  }
  
  // 기존 setDimensions 함수를 제거하고 위의 setDimensionsNearElement와 processInputs로 대체하세요.
  // directInputUpdate 함수는 그대로 유지합니다.
  
  
  // 대체 방법: 직접 DOM 속성 및 React props 업데이트 시도
  function directInputUpdate(inputs, width, height) {
    if (inputs.length >= 2) {
      // 기본 입력 속성 업데이트
      inputs[0].setAttribute('value', width);
      inputs[1].setAttribute('value', height);
      
      // React 내부 속성에 대한 시도
      if (inputs[0]._valueTracker) {
        inputs[0]._valueTracker.setValue('');
        inputs[1]._valueTracker.setValue('');
      }
      
      // 다시 이벤트 발생
      inputs[0].value = width;
      inputs[1].value = height;
      
      inputs.forEach(input => {
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      
      // 직접 클릭 이벤트로 포커스 시도
      setTimeout(() => {
        try {
          inputs[0].focus();
          inputs[0].blur();
          inputs[1].focus();
          inputs[1].blur();
        } catch(e) {
          console.log('Focus/blur failed', e);
        }
      }, 50);
    }
  }
  
  // Initialize when page loads and observe DOM changes
  function initialize() {
    addPresetButtons();
    
    // Set up a mutation observer to detect when elements are added to the DOM
    const observer = new MutationObserver(() => {
      addPresetButtons();
    });
    
    // Start observing the document body for DOM changes
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  }
  
  // Try to initialize immediately and also wait for load event
  initialize();
  window.addEventListener('load', initialize);
  window.addEventListener('DOMContentLoaded', initialize);
  