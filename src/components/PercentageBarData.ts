type PercentageBarData = {
    ratio: number,
    percentage: string;
    color: string;
    bg_color: string;
}


function getPercentageBarData(ratio: number){
    let color = 'bg-red-600';
    let bg_color = 'bg-red-200';
    if (ratio >= 0.98) {
        color = 'bg-green-800';
        bg_color = 'bg-green-200';
    } else if(ratio >= 0.95) {
        color = 'bg-green-600';
        bg_color = 'bg-green-200';
    } else if (ratio >= 0.90) {
        color = 'bg-yellow-300';
        bg_color = 'bg-yellow-200';
    } else if (ratio >= 0.8) {
        color = 'bg-yellow-400';
        bg_color = 'bg-yellow-200';
    }

    return {
        ratio: ratio,
        percentage: `${(ratio * 100.0).toFixed(1)}%`,
        color: color,
        bg_color: bg_color,
    }
}

export { getPercentageBarData };
export type { PercentageBarData };
