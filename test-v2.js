const input = "We offer a variety of event spaces for different needs and capacities. * **Auditorium:** 110 m², up to 80 people. Price: €830 half day / €1,490 full day (excl. VAT). * **Lounge:** 100 m², up to 20 people. Price: €720 half day / €1,320 full day (excl. VAT). * **Twenty Eight:** 370 m², up to 130 people. Price: €1,320 half day / €2,620 full day (excl. VAT). * **Breakout Lab:** 100 m², up to 30 people. Price: €610 half day / €1,160 full day (excl. VAT). For full details, visit the [Event Spaces page](https://wexelerate.com/rent-an-event-space/). To receive a non-binding personalized offer, submit your [request here](https://tally.so/r/aQ4Elv).";

const parseMD = (str) => {
    if (!str) return '';
    let html = str;
    
    // First, convert bold tags so they don't get tangled in our text logic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Handle exact syntax of n8n formatting where * starts a bullet.
    // If we have " * ", we effectively start a new line.
    // Instead of regex capturing groups which might run over, we can split.
    html = html.replace(/(?:^|\n|\s)\* /g, '<br/><br/><span style="margin-right:6px;">•</span>');

    // Make links nice
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="text-decoration:underline;font-weight:600;color:inherit;">$1</a>');

    // Turn \n into breaks
    html = html.replace(/\ng/, '<br/>');

    // Sometimes they just have . followed by For full details. If the user wants a break before it
    // we could add a break after (excl. VAT). if no bullet comes next.
    // But realistically, let's keep it simple.

    return html;
};

console.log(parseMD(input));
