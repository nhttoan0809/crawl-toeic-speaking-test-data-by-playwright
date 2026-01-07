
### STEP 1: ACCESS THE LINKS

### 🗣️ TOEIC Speaking Test LINKS
https://study4.com/tests/5895/toeic-sw-speaking-test-1
https://study4.com/tests/5896/toeic-sw-speaking-test-2
https://study4.com/tests/5897/toeic-sw-speaking-test-3
https://study4.com/tests/5898/toeic-sw-speaking-test-4
https://study4.com/tests/5899/toeic-sw-speaking-test-5
https://study4.com/tests/5900/toeic-sw-speaking-test-6
https://study4.com/tests/5901/toeic-sw-speaking-test-7
https://study4.com/tests/5902/toeic-sw-speaking-test-8
https://study4.com/tests/5903/toeic-sw-speaking-test-9
https://study4.com/tests/5904/toeic-sw-speaking-test-10
https://study4.com/tests/5905/toeic-sw-speaking-test-11/
https://study4.com/tests/5906/toeic-sw-speaking-test-12/
https://study4.com/tests/5907/toeic-sw-speaking-test-13/
https://study4.com/tests/5908/toeic-sw-speaking-test-14/
https://study4.com/tests/6001/toeic-sw-speaking-test-15
https://study4.com/tests/5924/toeic-sw-speaking-test-16/
https://study4.com/tests/5925/toeic-sw-speaking-test-17/
https://study4.com/tests/5926/toeic-sw-speaking-test-18/
https://study4.com/tests/5927/toeic-sw-speaking-test-19/
https://study4.com/tests/5928/toeic-sw-speaking-test-20/
https://study4.com/tests/5929/toeic-sw-speaking-test-21/
https://study4.com/tests/5930/toeic-sw-speaking-test-22/
https://study4.com/tests/5931/toeic-sw-speaking-test-23/
https://study4.com/tests/5932/toeic-sw-speaking-test-24/
https://study4.com/tests/5933/toeic-sw-speaking-test-25/
https://study4.com/tests/5934/toeic-sw-speaking-test-26/
https://study4.com/tests/5935/toeic-sw-speaking-test-27/
https://study4.com/tests/5936/toeic-sw-speaking-test-28/
https://study4.com/tests/5937/toeic-sw-speaking-test-29/
https://study4.com/tests/5938/toeic-sw-speaking-test-30/
https://study4.com/tests/5939/toeic-sw-speaking-test-31/
https://study4.com/tests/5940/toeic-sw-speaking-test-32/
https://study4.com/tests/5941/toeic-sw-speaking-test-33/
https://study4.com/tests/5942/toeic-sw-speaking-test-34/
https://study4.com/tests/5943/toeic-sw-speaking-test-35/
https://study4.com/tests/5944/toeic-sw-speaking-test-36/
https://study4.com/tests/5945/toeic-sw-speaking-test-37/
https://study4.com/tests/5946/toeic-sw-speaking-test-38/
https://study4.com/tests/5947/toeic-sw-speaking-test-39/
https://study4.com/tests/5948/toeic-sw-speaking-test-40/
https://study4.com/tests/5949/toeic-sw-speaking-test-41/
https://study4.com/tests/5950/toeic-sw-speaking-test-42/
https://study4.com/tests/5951/toeic-sw-speaking-test-43/
https://study4.com/tests/5952/toeic-sw-speaking-test-44/
https://study4.com/tests/5953/toeic-sw-speaking-test-45/





### STEP 2: GET THE LINK TO THE REAL EXAM WITH FULL QUESTIONS



const currentUrl = window.location.href;
const testIdMatch = currentUrl.match(/tests\/(\d+)/);
let testId = testIdMatch && testIdMatch[1] ? testIdMatch[1] : '';

const formElement = document.querySelector(`form[action*="/tests/${testId}/"]`);

if (!formElement) {
  console.error('Form not found.');
} else {
  const checkboxes = formElement.querySelectorAll('input[type="checkbox"]');
  const checkboxIds = Array.from(checkboxes).map(checkbox => checkbox.id);

  let queryString = checkboxIds.map(id => `part=${id.replace('part-', '')}`).join('&');

  const baseUrl = `https://study4.com/tests/${testId}/practice/`;
  const finalUrl = `${baseUrl}?${queryString}`;

  console.log('Generated URL:', finalUrl);
}



### STEP 3: GET THE ALL DATA



const data = {};
const urlParams = new URLSearchParams(window.location.search);
const partIds = urlParams.getAll('part');

// Ensure we have at least 5 part IDs for the 5 items
if (partIds.length >= 5) {

  // Item 1: div#partcontent-XXXXX - two paragraphs of text
  const item1Id = partIds[0];
  const item1 = document.querySelector(`div#partcontent-${item1Id}`);
  if (item1) {
    const paragraphs = Array.from(item1.querySelectorAll('div.context-content.text-highlightable > div > p'));
    data['Item 1'] = paragraphs.map(p => p.innerText.trim()).filter(text => text.length > 0 && !text.includes('Read a text aloud') && !text.includes('Viết ghi chú / dàn ý'));
  }

  // Item 2: div#partcontent-XXXXX - two images
  const item2Id = partIds[1];
  const item2 = document.querySelector(`div#partcontent-${item2Id}`);
  if (item2) {
    const images = Array.from(item2.querySelectorAll('img'));
    data['Item 2'] = images.map(img => img.src);
  }

  // Item 3: div#partcontent-XXXXX - one text content
  const item3Id = partIds[2];
  const item3 = document.querySelector(`div#partcontent-${item3Id}`);
  if (item3) {
    const textContainer = item3.querySelector('div.context-content.text-highlightable > div');
    if (textContainer) {
      data['Item 3'] = textContainer.innerText.trim();
    }
  }

  // Item 4: div#partcontent-XXXXX - one image and one text content
  const item4Id = partIds[3];
  const item4 = document.querySelector(`div#partcontent-${item4Id}`);
  if (item4) {
    const img = item4.querySelector('img');
    const textContainer = item4.querySelector('div.context-content.text-highlightable > div');
    data['Item 4'] = {};
    if (img) {
      data['Item 4']['image'] = img.src;
    }
    if (textContainer) {
      data['Item 4']['text'] = textContainer.innerText.trim();
    }
  }

  // Item 5: div#partcontent-XXXXX - one text content
  const item5Id = partIds[4];
  const item5 = document.querySelector(`div#partcontent-${item5Id}`);
  if (item5) {
    const textContainer = item5.querySelector('div.context-content.text-highlightable > div');
    if (textContainer) {
      data['Item 5'] = textContainer.innerText.trim();
    }
  }

   console.log({data});
} else {
  console.warn('Not enough part query parameters found in the URL to process all 5 items.');
}