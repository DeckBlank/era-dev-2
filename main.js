/**
 * main.js - Minimal interactions for eradev2.com
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('ERADEV2_LOG: System initialized.');

    // Update build date if needed or handle micro-animations
    const buildInfo = document.getElementById('build-info');
    if (buildInfo) {
        const now = new Date();
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const formattedDate = `${now.getDate()} ${months[now.getMonth()]}`;
        
        // Only update the date part after the //
        const currentText = buildInfo.textContent;
        if (currentText.includes('//')) {
            const prefix = currentText.split('//')[0];
            buildInfo.textContent = `${prefix}// ${formattedDate}`;
        }
    }

    // Add a simple hover effect to the terminal icon
    const terminalIcon = document.querySelector('.logo-box .material-symbols-outlined');
    if (terminalIcon) {
        terminalIcon.addEventListener('mouseover', () => {
            terminalIcon.style.textShadow = '0 0 20px var(--primary)';
        });
        terminalIcon.addEventListener('mouseout', () => {
            terminalIcon.style.textShadow = 'none';
        });
    }
});
