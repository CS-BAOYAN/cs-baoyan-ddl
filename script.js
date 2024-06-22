document.addEventListener('DOMContentLoaded', function() {
    fetch('config/schools.json')
        .then(response => response.json())
        .then(data => {
            let schools = data.schools;
            
            function formatDate(date) {
                const options = {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                };
                return new Intl.DateTimeFormat('zh-CN', options).format(date);
            }

            function updateCountdowns() {
                const schoolList = document.getElementById('school-list');
                schoolList.innerHTML = '';

                const now = new Date();

                schools.forEach(school => {
                    if (school.deadline !== 'N/A' && school.deadline !== '') {
                        const deadlineDate = new Date(school.deadline);
                        const timeRemaining = deadlineDate - now;
                        if (timeRemaining >= 0) {
                            const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
                            const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
                            const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
                            school.date = formatDate(deadlineDate);
                            school.timeRemaining = timeRemaining;
                            school.countdown = `${days} 天 ${hours} 小时 ${minutes} 分钟 ${seconds} 秒`;
                        }
                        else {
                            school.timeRemaining = Infinity; // 将时间设为无穷大，以便排序时排在最后
                            school.countdown = '已经结束';
                            school.date = formatDate(deadlineDate);
                        }
                    } else {
                        school.timeRemaining = Infinity - 1; // 将时间设为10000，以便排序时排在最后，而在过时之前
                        school.countdown = 'N/A';
                        school.date = 'N/A';
                    }
                });

                // 按倒计时排序，若倒计时相同则按字典序排序
                schools.sort((a, b) => {
                    if (a.timeRemaining === b.timeRemaining) {
                        if (a.name === b.name) {
                            return a.institute - b.institute;
                        }
                        return a.name.localeCompare(b.name);
                    }
                    return a.timeRemaining - b.timeRemaining;
                });

                schools.forEach(school => {
                    const schoolDiv = document.createElement('div');
                    schoolDiv.className = 'school';
                    
                    if(school.description === '')
                        school.description = `${school.name}${school.institute}`;
                    schoolDiv.innerHTML = `
                        <h2>${school.name} ${school.institute}</h2>
                        <p>${school.description}</p>
                        <p><strong>日期:</strong> ${school.date}</p>
                        <p><strong>网站:</strong> <a href="${school.website}" target="_blank">${school.website}</a></p>
                        <p><strong>倒计时:</strong> ${school.countdown}</p>
                        <div class="tags">
                            ${school.tags.map(tag => `<span>${tag}</span>`).join('')}
                        </div>
                    `;

                    schoolList.appendChild(schoolDiv);
                });
            }

            updateCountdowns();
            setInterval(updateCountdowns, 1000);
        });
});
