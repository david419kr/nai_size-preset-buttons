// Function to create and add the preset buttons

// 텍스트 헤더("Image Settings" | "画像設定")를 기준으로
// 바로 다음 <div> 컨테이너를 찾아 반환
function getSelectContainers() {
  const containers = [];

  // XPath로 텍스트가 정확히 일치하는 <div>를 찾음
  const xpath =
    "//div[normalize-space(text())='Image Settings' or normalize-space(text())='画像設定']";
  const iterator = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.ORDERED_NODE_ITERATOR_TYPE,
    null
  );

  for (let node = iterator.iterateNext(); node; node = iterator.iterateNext()) {
    // ① 헤더의 형제 div가 바로 컨테이너인 경우
    if (node.nextElementSibling) {
      containers.push(node.nextElementSibling);
    }
    // ② 또는 헤더를 감싸는 부모 다음 형제를 컨테이너로 취급 (레이아웃이 바뀐 경우 대비)
    else if (node.parentElement && node.parentElement.nextElementSibling) {
      containers.push(node.parentElement.nextElementSibling);
    }
  }
  return containers;
}

function addPresetButtons() {    
    const selectContainers = getSelectContainers();

    let parent;

  if (selectContainers.length === 0) {
    // 아직 DOM이 완전히 안 뜬 경우 재시도
    setTimeout(addPresetButtons, 1000);
    return;
  }
    
    // Process each container
    selectContainers.forEach(selectContainer => {
      //   skip if selectContainer.parentNode has a child named id 'nai-dimension-presets'
      if (selectContainer.parentNode.parentNode.querySelector('#nai-dimension-presets')) {
        return;
      }

      // Create a container for our preset buttons
      const presetContainer = document.createElement('div');
      presetContainer.id = 'nai-dimension-presets';
      presetContainer.className = 'nai-preset-container';
      
      // 기본 프리셋 값
      const DEFAULT_PRESETS = [
        { width: 1024, height: 1024, label: '1024×1024' },
        { width: 896, height: 1152, label: '896x1152' },
        { width: 832, height: 1216, label: '832×1216' },
        { width: 768, height: 1280, label: '768×1280' },
        { width: 512, height: 1920, label: '512×1920' }
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
      });
      parent = selectContainer.parentNode;
      parent.insertBefore(presetContainer, selectContainer);      
      const last = parent.lastElementChild;
      const secondLast = last ? last.previousElementSibling : null;

      if (secondLast) {
        secondLast.style.display = 'none';
      }
      if (last) {
        last.style.display = 'none';
      }
    });
    
    const modelSelector = document.querySelector('.sc-7439d21c-12.crfQrQ');
      if (modelSelector) {
        if (!modelSelector.querySelector('#nai-dimension-presets')) {
          const spacerdiv = document.createElement('div');
          spacerdiv.style.display = 'flex';
          spacerdiv.style.flexDirection = 'row';
          spacerdiv.style.justifyContent = 'space-between';
          spacerdiv.style.width = '100%';
          spacerdiv.style.padding = '10px';
          
          modelSelector.appendChild(spacerdiv);
          modelSelector.appendChild(parent);
        }
      }
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

      directInputUpdate(inputs, targetWidth, targetHeight);
      
      console.log(`Set dimensions to ${targetWidth}×${targetHeight}`);
    }
  }
  
  
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
  