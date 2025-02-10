export default function (fabric: any) {
	fabric.Arrow = fabric.util.createClass(fabric.Line, {
		initialize(e: any, t: any) {
			this.callSuper('initialize', e, t);
			this.set({ type: 'arrow' });
		},
		_render(e: any) {
			e.beginPath();
			const r = this.calcLinePoints();
			const headlen = 10;
			const theta = this.theta != null ? this.theta : 45;
			const angle = Math.atan2(r.y1 - r.y2, r.x1 - r.x2) * 180 / Math.PI;
			const angle1 = (angle + theta) * Math.PI / 180;
			const angle2 = (angle - theta) * Math.PI / 180;
			const topX = headlen * Math.cos(angle1);
			const topY = headlen * Math.sin(angle1);
			const botX = headlen * Math.cos(angle2);
			const botY = headlen * Math.sin(angle2);

			let arrowX = r.x1 - topX;
			let arrowY = r.y1 - topY;

			const s = e.strokeStyle;

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

			// eslint-disable-next-line ts/no-unused-expressions, no-sequences
			e.strokeStyle = this.stroke || e.fillStyle, this.stroke && this._renderStroke(e), e.strokeStyle = s;
		},
		complexity() {
			return 2;
		},
	});

	fabric.Arrow.fromObject = function (object: any, callback: any) {
		function _callback(instance: any) {
			delete instance.points;
			callback && callback(instance);
		}

		;
		const options = { ...object };
		options.points = [object.x1, object.y1, object.x2, object.y2];
		fabric.Object._fromObject('Arrow', options, _callback, 'points');
	};
}
