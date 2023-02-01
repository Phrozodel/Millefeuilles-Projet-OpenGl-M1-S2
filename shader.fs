
precision mediump float;

varying vec2 tCoords;

uniform sampler2D uSampler;

//void main(void) {
//	gl_FragColor = texture2D(uSampler, vec2(tCoords.s, tCoords.t));
//}
void main(void) { 
	vec4 color = texture2D(uSampler, vec2(tCoords.s, tCoords.t));
	color.a = 0.7; // Définition de l'opacité ( entre 0 et 1, grand alpha = opaque ). 
	gl_FragColor = color; // La fonction 2D vas chercher dans la texture passée en paramètre la couleur d'un pixel dans celle ci selon ses coordonées, entre 0 et 1. Couleur potentiel d'un pixel, remplissage par ligne de balayage. 
}
