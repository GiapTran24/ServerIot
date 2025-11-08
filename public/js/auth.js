const API_BASE_URL = 'http://localhost:5000/api'; 
const LOGIN_ENDPOINT = '/auth/login';          
const REGISTER_ENDPOINT = '/auth/register';      
const DASHBOARD_URL = 'dashboard.html';          // Trang dashboard sau khi đăng nhập thành công
const TOKEN_KEY = 'iot_auth_token';              // Key để lưu token trong localStorage

// --- HÀM KIỂM TRA ĐĂNG NHẬP ---
function checkAuthAndRedirect() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        window.location.href = DASHBOARD_URL;
    }
}

// --- HÀM HIỂN THỊ THÔNG BÁO ---
function showAlert(message, type = 'danger') {
    // Tìm hoặc tạo một container thông báo
    let container = document.getElementById('alert-message-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'alert-message-container';
        container.className = 'mb-4';
        const cardBody = document.querySelector('.card-body');
        if (cardBody) {
            cardBody.prepend(container);
        } else {
            console.error("Không tìm thấy .card-body để chèn thông báo.");
            return;
        }
    }
    
    // Nội dung thông báo
    container.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    // Tự động xóa thông báo sau 5 giây (trừ thông báo thành công khi chuyển hướng)
    if (type !== 'success') {
        setTimeout(() => {
            const alertElement = container.querySelector('.alert');
            if (alertElement) {
                const bsAlert = bootstrap.Alert.getOrCreateInstance(alertElement);
                bsAlert.close();
            }
        }, 5000);
    }
}

// --- XỬ LÝ ĐĂNG NHẬP ---
async function handleLogin(event) {
    event.preventDefault(); // Ngăn chặn hành vi submit mặc định của form
    
    const form = event.target;
    const username = form.loginUsername.value.trim();
    const password = form.loginPassword.value;
    const button = document.getElementById('login-btn');
    
    // Kiểm tra tính hợp lệ cơ bản
    if (!username || !password) {
        showAlert('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.');
        return;
    }

    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...';

    try {
        const response = await fetch(API_BASE_URL + LOGIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Đăng nhập thành công
            const token = data.token; // Giả định API trả về { token: '...' }
            
            if (token) {
                // Lưu token vào LocalStorage
                localStorage.setItem(TOKEN_KEY, token);
                
                showAlert('Đăng nhập thành công! Đang chuyển hướng...', 'success');
                // Chuyển hướng đến trang dashboard
                window.location.href = DASHBOARD_URL;
            } else {
                 showAlert('Đăng nhập thành công nhưng không nhận được token.');
            }
        } else {
            // Lỗi từ server (4xx hoặc 5xx)
            const errorMessage = data.message || 'Tên đăng nhập hoặc mật khẩu không đúng.'; // Giả định API trả về { message: '...' }
            showAlert(errorMessage);
        }
    } catch (error) {
        console.error('Lỗi khi gửi yêu cầu đăng nhập:', error);
        showAlert('Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
        button.disabled = false;
        button.innerHTML = 'Đăng nhập';
    }
}


// --- XỬ LÝ ĐĂNG KÝ ---
async function handleRegister(event) {
    event.preventDefault(); // Ngăn chặn hành vi submit mặc định của form
    
    const form = event.target;
    const username = form.regUsername.value.trim();
    const email = form.regEmail.value.trim();
    const password = form.regPassword.value;
    const confirmPassword = form.regConfirmPassword.value;
    const button = document.getElementById('register-btn');
    
    // Kiểm tra tính hợp lệ cơ bản
    if (!username || !email || !password || !confirmPassword) {
        showAlert('Vui lòng nhập đầy đủ các trường.');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('Mật khẩu và Xác nhận Mật khẩu không khớp.');
        return;
    }
    
    if (password.length < 6) { // Ví dụ: yêu cầu mật khẩu tối thiểu 6 ký tự
         showAlert('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
    }

    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...';

    try {
        const response = await fetch(API_BASE_URL + REGISTER_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Đăng ký thành công
            showAlert('Đăng ký tài khoản thành công! Bạn có thể Đăng nhập ngay bây giờ.', 'success');
            
            // Tự động chuyển sang tab Đăng nhập sau khi đăng ký thành công
            const loginTab = document.getElementById('login-tab');
            if (loginTab) {
                bootstrap.Tab.getInstance(loginTab).show();
            }

        } else {
            // Lỗi từ server
            const errorMessage = data.message || 'Lỗi đăng ký. Tên đăng nhập hoặc Email đã tồn tại.'; // Giả định API trả về { message: '...' }
            showAlert(errorMessage);
        }
    } catch (error) {
        console.error('Lỗi khi gửi yêu cầu đăng ký:', error);
        showAlert('Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
        button.disabled = false;
        button.innerHTML = 'Đăng ký';
    }
}

// --- KHỞI TẠO VÀ LẮNG NGHE SỰ KIỆN ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Kiểm tra đăng nhập ngay khi trang được tải
    checkAuthAndRedirect();
    
    // 2. Lắng nghe sự kiện submit form Đăng nhập
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 3. Lắng nghe sự kiện submit form Đăng ký
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});