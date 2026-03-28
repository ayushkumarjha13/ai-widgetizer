const parseMD = (str) => {
    if (!str) return '';
    let html = str;
    
    // Convert newlines to breaks
    html = html.replace(/\ng/, '<br/>');
    
    // Replace **bold**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Replace markdown links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Handle inline lists: " * " -> line break + bullet.
    // E.g., " capacities. * **Auditorium:**" -> " capacities.<br/>• <strong>Auditorium:</strong>"
    html = html.replace(/(?:^|\n|\s)\* /g, '<br/><br/><span style="margin-right:6px;">•</span>');

    return html;
};

const input = "We offer a variety of event spaces for different needs and capacities. * **Auditorium:** 110 m², up to 80 people. Price: €830 half day / €1,490 full day (excl. VAT). * **Lounge:** 100 m², up to 20 people. Price: €720 half day / €1,320 full day (excl. VAT). * **Twenty Eight:** 370 m², up to 130 people. Price: €1,320 half day / €2,620 full day (excl. VAT). * **Breakout Lab:** 100 m², up to 30 people. Price: €610 half day / €1,160 full day (excl. VAT). For full details, visit the [Event Spaces page](https://wexelerate.com/rent-an-event-space/). To receive a non-binding personalized offer, submit your [request here](https://tally.so/r/aQ4Elv).";

console.log(parseMD(input));
