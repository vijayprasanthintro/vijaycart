import { exportCSV, exportExcel } from '../../utils/exportData';

export default function AdminExport({ filename, headers, rows, disabled = false, className = '' }) {
    const onClick = (fn, type) => {
        if (disabled || !rows.length) return;
        fn(filename, headers, rows);
    };
    return (
        <div className={`ad-toolbar ${className}`}>
            <button
                type="button"
                className="ad-btn ad-btn--soft ad-btn--sm"
                disabled={disabled || !rows.length}
                title="Download CSV"
                onClick={() => onClick(exportCSV, 'csv')}
            >
                <i className="fa fa-file-text-o" aria-hidden="true"></i> CSV
            </button>
            <button
                type="button"
                className="ad-btn ad-btn--soft ad-btn--sm"
                disabled={disabled || !rows.length}
                title="Download Excel"
                onClick={() => onClick(exportExcel, 'xls')}
            >
                <i className="fa fa-file-excel-o" aria-hidden="true"></i> Excel
            </button>
        </div>
    );
}
