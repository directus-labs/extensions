
export default function (fabric:any) {
  fabric.Arrow = fabric.util.createClass(fabric.Line, {
    initialize: function (e:any, t:any) {
      this.callSuper("initialize", e, t)
      this.set({ type: 'arrow' });
    },
    _render: function (e:any) {
      e.beginPath();
      var r = this.calcLinePoints();
      var headlen = 10;
      var theta = this.theta != null ? this.theta : 45;
      var angle = Math.atan2(r.y1 - r.y2, r.x1 - r.x2) * 180 / Math.PI;
      var angle1 = (angle + theta) * Math.PI / 180;
      var angle2 = (angle - theta) * Math.PI / 180;
      var topX = headlen * Math.cos(angle1);
      var topY = headlen * Math.sin(angle1);
      var botX = headlen * Math.cos(angle2);
      var botY = headlen * Math.sin(angle2);

      var arrowX = r.x1 - topX;
      var arrowY = r.y1 - topY;

      var s = e.strokeStyle;

      e.beginPath();
      e.moveTo(arrowX, arrowY);
      e.moveTo(r.x1, r.y1);
      e.lineTo(r.x2, r.y2);
      arrowX = r.x2 + topX;
      arrowY = r.y2 + topY;
      e.moveTo(arrowX, arrowY);
      e.lineTo(r.x2, r.y2);
      arrowX = r.x2 + botX;
      arrowY = r.y2 + botY;
      e.lineTo(arrowX, arrowY);

      e.lineWidth = this.strokeWidth;

      e.strokeStyle = this.stroke || e.fillStyle, this.stroke && this._renderStroke(e), e.strokeStyle = s
    },
    complexity: function () {
        return 2
    }
  });
  fabric.Arrow.fromObject = function(object:any, callback:any) {
    function _callback(instance:any) {
      delete instance.points;
      callback && callback(instance);
    };
    var options = {...object};
    options.points = [object.x1, object.y1, object.x2, object.y2];
    fabric.Object._fromObject('Arrow', options, _callback, 'points');
  };
}