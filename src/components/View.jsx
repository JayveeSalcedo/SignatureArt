/** Standard kiosk screen: bilingual header, body, and a footer action bar. */
export function View({ cls = '', en, ar, foot, children, ...rest }) {
  return (
    <div className={`view ${cls}`} {...rest}>
      {en && (
        <div className="vhead">
          <h3>{en}</h3>
          <span className="ar">{ar}</span>
        </div>
      )}
      {children}
      {foot && <div className="vfoot">{foot}</div>}
    </div>
  );
}
