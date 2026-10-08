// Supabase 설정
const SUPABASE_URL = 'https://xpojntidektczonzfpwh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwb2pudGlkZWt0Y3pvbnpmcHdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MDM4ODUsImV4cCI6MjEwNjk3OTg4NX0.QgFX7sadTh6pnCc57PfVBlXs12hckTyAZSRfSb4ltEg';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// HTML에서 요소(태그)들을 찾아와서 변수에 저장합니다.
const orderForm = document.getElementById('orderForm');
const drinkSelect = document.getElementById('drink');
const sizeRadios = document.getElementsByName('size');
const optionCheckboxes = document.getElementsByName('options');
const quantityInput = document.getElementById('quantity');
const totalPriceSpan = document.getElementById('totalPrice');
const orderMessage = document.getElementById('orderMessage');
const customerNameInput = document.getElementById('customerName');
const requestsInput = document.getElementById('requests');

// 탭 및 주문 내역 요소
const tabOrder = document.getElementById('tabOrder');
const tabHistory = document.getElementById('tabHistory');
const orderSection = document.getElementById('orderSection');
const historySection = document.getElementById('historySection');
const orderCountBadge = document.getElementById('orderCountBadge');
const emptyMessage = document.getElementById('emptyMessage');
const orderList = document.getElementById('orderList');
const historySummary = document.getElementById('historySummary');
const totalHistoryPriceSpan = document.getElementById('totalHistoryPrice');
const totalHistoryCountSpan = document.getElementById('totalHistoryCount');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// 주문 데이터를 저장할 배열과 주문 번호
let orders = [];
let orderIdCounter = 1;

// 1. 탭 전환 기능
tabOrder.addEventListener('click', function() {
    // 탭 스타일 변경
    tabOrder.classList.add('active');
    tabHistory.classList.remove('active');
    // 영역 보이기/숨기기
    orderSection.classList.remove('hidden');
    historySection.classList.add('hidden');
});

tabHistory.addEventListener('click', function() {
    // 탭 스타일 변경
    tabHistory.classList.add('active');
    tabOrder.classList.remove('active');
    // 영역 보이기/숨기기
    historySection.classList.remove('hidden');
    orderSection.classList.add('hidden');
});

// 2. 예상 금액을 계산하는 함수
function calculateTotal() {
    let total = 0;

    const selectedDrinkOption = drinkSelect.options[drinkSelect.selectedIndex];
    const drinkPrice = parseInt(selectedDrinkOption.getAttribute('data-price')) || 0;

    if (drinkPrice > 0) {
        total += drinkPrice;

        for (const radio of sizeRadios) {
            if (radio.checked) {
                total += parseInt(radio.getAttribute('data-price')) || 0;
                break;
            }
        }

        for (const checkbox of optionCheckboxes) {
            if (checkbox.checked) {
                total += parseInt(checkbox.getAttribute('data-price')) || 0;
            }
        }

        const quantity = parseInt(quantityInput.value) || 1;
        total = total * quantity;
    }

    totalPriceSpan.textContent = total.toLocaleString();
    return total;
}

// 입력값이 바뀔 때마다 자동으로 금액 다시 계산하기
drinkSelect.addEventListener('change', calculateTotal);
quantityInput.addEventListener('input', calculateTotal);
for (const radio of sizeRadios) {
    radio.addEventListener('change', calculateTotal);
}
for (const checkbox of optionCheckboxes) {
    checkbox.addEventListener('change', calculateTotal);
}

// 3. 주문 내역 화면에 그리기
function renderOrders() {
    // 목록 비우기 (innerHTML 대신 자식 요소들을 하나씩 지우거나 빈 텍스트로 만듦)
    orderList.textContent = ''; 

    // 주문이 없을 때
    if (orders.length === 0) {
        emptyMessage.classList.remove('hidden');
        historySummary.classList.add('hidden');
        orderCountBadge.textContent = '0';
        return;
    }

    // 주문이 있을 때
    emptyMessage.classList.add('hidden');
    historySummary.classList.remove('hidden');
    orderCountBadge.textContent = orders.length;

    let sumPrice = 0;

    // 최신 주문이 맨 위에 오도록 배열을 뒤집어서 반복 (원본 배열 보호를 위해 slice 사용)
    const reversedOrders = orders.slice().reverse();
    for (const order of reversedOrders) {
        sumPrice += order.price;

        // 카드(div) 만들기
        const card = document.createElement('div');
        card.className = 'order-card';

        // 1줄: "#1 홍길동님 · 5,000원"
        const line1 = document.createElement('div');
        line1.className = 'order-card-line1';
        line1.textContent = `#${order.id} ${order.name}님 · ${order.price.toLocaleString()}원`;
        card.appendChild(line1);

        // 2줄: "카페라떼 M사이즈 (샷 추가) 1잔"
        const line2 = document.createElement('div');
        line2.className = 'order-card-line2';
        line2.textContent = `${order.drink} ${order.size}사이즈${order.optionsStr} ${order.quantity}잔`;
        card.appendChild(line2);

        // 3줄: "요청사항 · 주문 시간" (요청사항이 있을 때만 포함)
        const line3 = document.createElement('div');
        line3.className = 'order-card-line3';
        if (order.request) {
            line3.textContent = `${order.request} · ${order.time}`;
        } else {
            line3.textContent = `${order.time}`;
        }
        card.appendChild(line3);

        // 취소 버튼
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = '취소';
        cancelBtn.onclick = function() {
            if (confirm(`주문번호 #${order.id}을(를) 취소하시겠습니까?`)) {
                // 배열에서 해당 주문 삭제
                orders = orders.filter(o => o.id !== order.id);
                renderOrders(); // 삭제 후 다시 그리기
            }
        };
        card.appendChild(cancelBtn);

        // 목록에 카드 추가
        orderList.appendChild(card);
    }

    // 하단 총 주문 요약 업데이트
    totalHistoryPriceSpan.textContent = sumPrice.toLocaleString();
    totalHistoryCountSpan.textContent = orders.length;
}

// 4. 폼 제출(주문하기) 버튼
orderForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const customerName = customerNameInput.value.trim();
    if (customerName === '') {
        alert("이름을 입력해주세요");
        return;
    }
    
    const phone = document.getElementById('phone') ? document.getElementById('phone').value : '';

    if (drinkSelect.value === "") {
        alert("음료를 선택해주세요");
        return;
    }

    const drinkText = drinkSelect.options[drinkSelect.selectedIndex].text.split(' (')[0];
    
    let sizeText = 'M';
    for (const radio of sizeRadios) {
        if (radio.checked) {
            sizeText = radio.value;
            break;
        }
    }

    let selectedOptions = [];
    for (const checkbox of optionCheckboxes) {
        if (checkbox.checked) {
            const optionName = checkbox.parentElement.textContent.trim().split(' (')[0];
            selectedOptions.push(optionName);
        }
    }

    let optionsString = '';
    if (selectedOptions.length > 0) {
        optionsString = ` (${selectedOptions.join(', ')})`;
    }

    const quantity = parseInt(quantityInput.value) || 1;
    const finalPrice = calculateTotal();
    const finalPriceString = finalPrice.toLocaleString();
    const requestText = requestsInput.value.trim();

    // 현재 시간 구하기 (HH:MM)
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    try {
        // Supabase에 데이터 저장
        const { error } = await supabaseClient
            .from('cafe_menu')
            .insert([
                {
                    customer_name: customerName,
                    phone: phone,
                    drink: drinkText,       // 컬럼명: drink
                    size: sizeText,
                    options: selectedOptions,
                    quantity: quantity,
                    total_price: finalPrice
                }
            ]);

        if (error) {
            console.error('Supabase Error:', error);
            // 에러의 상세 내용을 알림창에 띄워줍니다.
            alert(`주문 접수 중 오류가 발생했습니다.\n원인: ${error.message || '알 수 없는 오류'}\n(자세한 내용은 F12 개발자 도구를 확인하세요)`);
            return; 
        }

        // (주문 성공 메시지는 reset() 이후 아래쪽에서 표시합니다)

        // 주문 배열에 새 주문 추가 (로컬 주문 내역 탭 용도)
        orders.push({
            id: orderIdCounter++,
            name: customerName,
            drink: drinkText,
            size: sizeText,
            optionsStr: optionsString,
            quantity: quantity,
            request: requestText,
            price: finalPrice,
            time: timeString
        });

        // 주문 내역 다시 그리기
        renderOrders();

        // 폼 초기화를 먼저 합니다 (reset 이벤트가 메시지를 숨기기 때문에 먼저 실행)
        orderForm.reset();
        setTimeout(calculateTotal, 0);

        // reset() 이후에 메시지를 표시해야 숨겨지지 않습니다
        const resultMessage = `${customerName}님, ${drinkText} ${sizeText}사이즈${optionsString} ${quantity}잔, 총 ${finalPriceString}원 주문이 접수되었습니다!`;
        orderMessage.textContent = resultMessage;
        orderMessage.style.display = 'block';
        
    } catch (error) {
        console.error('Error inserting data:', error);
        alert(`주문 접수 중 오류가 발생했습니다.\n원인: ${error.message}`);
    }
});

// 5. 다시 작성(초기화) 버튼
orderForm.addEventListener('reset', function() {
    orderMessage.style.display = 'none';
    setTimeout(function() {
        calculateTotal();
    }, 0);
});

// 6. 내역 모두 지우기 버튼
clearHistoryBtn.addEventListener('click', function() {
    if (confirm('모든 주문 내역을 삭제하시겠습니까?')) {
        orders = [];
        renderOrders();
    }
});
