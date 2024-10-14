import {curve, Diagram, diagram_combine, line} from "../diagram"
import { circle, square} from "../shapes";
import { round_corner } from "../modifier";
import { TAG } from "../tag_names";
import { V2 } from "../vector";



export function arrowHead (headsize: number): Diagram {
    return curve([V2(-headsize, -headsize), V2(0,0), V2(headsize, -headsize)]).fill('none').move_origin(V2(0,0)).append_tags(TAG.ARROW_HEAD)
}

export function arrow2( size: number , headsize: number, color: string): Diagram {
    const arrow = arrowHead(headsize).stroke(color).strokewidth(3).translate(V2(0, size)).strokewidth(2)
    const arrowline = line(V2(0, size), V2(0, -size)).stroke(color).strokewidth(2).append_tags(TAG.ARROW_LINE)
    const arrowDown = arrow.position(arrowline.get_anchor('bottom-center')).reflect()
    return diagram_combine(arrow,  arrowDown, arrowline,).move_origin(arrowline.get_anchor('center-center'))
}

export function verticalLocator  (radius: number = 3, fill: string = 'white', color: string = "#8B5CF6", headsize:number = 1.2 ): Diagram  {
    const padding = radius * 0.5
    const bg_sq = square(radius*2.4).fill(color).opacity(0.25).apply(round_corner(4)).stroke('none')
    const sq = square(radius*2).fill(fill).apply(round_corner(3)).stroke('none')
    const arr = arrow2(padding, headsize, color)
    return diagram_combine(bg_sq, sq, arr)
}

export function horizontalLocator  (radius: number = 3, fill: string = 'white', color: string = "#8B5CF6", headsize:number = 1.2 ): Diagram  {
  return verticalLocator(radius, fill, color, headsize).rotate(Math.PI / 2)
}

export function spanLocator  (radius: number = 3, fill: string = 'white', color: string = "#8B5CF6", headsize:number = 1.2 ): Diagram  {
    const padding = radius * 0.5
    const bg_sq = square(radius*2.4).fill(color).opacity(0.25).apply(round_corner(4)).stroke('none')
    const sq = square(radius*2).fill(fill).apply(round_corner(3)).stroke('none')
    const ci = circle(padding).stroke('none').fill(color)
    return diagram_combine(bg_sq, sq, ci)
}
