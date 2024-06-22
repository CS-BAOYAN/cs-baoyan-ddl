document.addEventListener('DOMContentLoaded', function () {
    let schools = [];
    const schoolList = document.getElementById('school-list');
    const searchInput = document.getElementById('search');
    const clearSearchButton = document.getElementById('clear-search');

    fetch('config/schools.json')
        .then(response => response.json())
        .then(data => {
            schools = data.schools;
            updateCountdowns();
            setInterval(updateCountdowns, 1000);
        });

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

    function hashColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return "#" + "00000".substring(0, 6 - color.length) + color;
    }

    function updateCountdowns() {
        schoolList.innerHTML = '';

        const now = new Date();
        const selectedTags = Array.from(document.querySelectorAll('.filters input:checked')).map(input => input.value);
        const searchQuery = searchInput.value.toLowerCase();

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
                    school.times = {
                        days: days,
                        hours: hours,
                        minutes: minutes,
                        seconds: seconds
                    };
                    school.progress = {
                        days: (days / 90) * 100,
                        hours: (hours / 24) * 100,
                        minutes: (minutes / 60) * 100,
                        seconds: (seconds / 60) * 100
                    };
                } else {
                    school.timeRemaining = Infinity; // 将时间设为无穷大，以便排序时排在最后
                    school.countdown = '已经结束';
                    school.date = formatDate(deadlineDate);
                    school.times = {
                        days: 0,
                        hours: 0,
                        minutes: 0,
                        seconds: 0
                    };
                    school.progress = {
                        days: 100,
                        hours: 100,
                        minutes: 100,
                        seconds: 100
                    };
                }
            } else {
                school.timeRemaining = Infinity - 1; // 将时间设为10000，以便排序时排在最后，而在过时之前
                school.countdown = 'N/A';
                school.date = 'N/A';
                school.times = {
                    days: 'N/A',
                    hours: 'N/A',
                    minutes: 'N/A',
                    seconds: 'N/A'
                };
                school.progress = {
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0
                };
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

        const filteredSchools = schools.filter(school => {
            const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => school.tags.includes(tag));
            const matchesSearch = searchQuery === '' || school.name.toLowerCase().includes(searchQuery) || school.institute.toLowerCase().includes(searchQuery);
            return matchesTags && matchesSearch;
        });

        filteredSchools.forEach(school => {
            const schoolDiv = document.createElement('div');
            schoolDiv.className = 'school';
            if (school.timeRemaining < 0) {
                schoolDiv.classList.add('red');
            } else {
                schoolDiv.classList.add('green');
            }

            if (school.description === '')
                school.description = `${school.name}${school.institute}`;
            schoolDiv.innerHTML = `
                <div>
                    <h2>${school.name} ${school.institute}</h2>
                    <p>${school.description}</p>
                    <p><strong>日期:</strong> ${school.date}</p>
                    <p><strong>网站:</strong> <a href="${school.website}" target="_blank">${school.website}</a></p>
                    <div class="tags">
                        ${school.tags.map(tag => `<span style="color: ${hashColor(tag)}; border-color: ${hashColor(tag)};">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="progress-container">
                    ${createProgressRing('天', school.progress.days, school.times.days)}
                    ${createProgressRing('小时', school.progress.hours, school.times.hours)}
                    ${createProgressRing('分钟', school.progress.minutes, school.times.minutes)}
                    ${createProgressRing('秒', school.progress.seconds, school.times.seconds)}
                </div>
            `;

            schoolList.appendChild(schoolDiv);
        });
    }

    function createProgressRing(label, progress, num) {
        const radius = 40;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (progress / 100) * circumference;
        if (num === 'N/A')
            labelName = `${num}`;
        else
            labelName = `${num} ${label}`;
        return `
            <div class="progress-ring">
                <svg width="100" height="100">
                    <circle class="progress-ring__circle-bg" cx="50" cy="50" r="${radius}"></circle>
                    <circle class="progress-ring__circle" cx="50" cy="50" r="${radius}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
                </svg>
                <div class="progress-ring__label">${labelName}</div>
            </div>
        `;
    }

    document.querySelectorAll('.filters input').forEach(input => {
        input.addEventListener('change', updateCountdowns);
    });

    searchInput.addEventListener('input', updateCountdowns);

    clearSearchButton.addEventListener('click', function () {
        searchInput.value = '';
        updateCountdowns();
    });
});
