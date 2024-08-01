#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <string.h>
#include <stdbool.h>

#include "glad.h"
#include <GLFW/glfw3.h>

#define WINDOW_TITLE "OpenGL Example"

#define LOG_INFO(str) do {    \
	printf("[LOG]: %s\n", str);    \
} while (0)

#define LOG_ERROR(str) do {   \
	fprintf(stderr, "[ERROR]: ");   \
	fprintf(stderr, "%s\n", str);  \
} while (0)

float min(float a, float b) {
	return (a < b) ? a : b;
}

void framebuffer_size_callback(GLFWwindow* window, int width, int height) {
	char s[100];

	float min_side = min((float)width, (float)height);

	float x = ((float)width - min_side) / 2;
	float y = ((float)height - min_side) / 2;

	glViewport(x, y, min_side, min_side);
}

char *load_file(const char *file_path) {
	FILE *fp;
	char *new_str;
	size_t new_str_len;

	if((fp = fopen(file_path, "rb")) == NULL) {
		fprintf(stderr, "`%s`: %s\n", file_path, strerror(errno));
		return NULL;
	}
	
	fseek (fp, 0, SEEK_END);
	new_str_len = ftell(fp);
	fseek (fp, 0, SEEK_SET);

	new_str = malloc(new_str_len + 1);

	if(new_str == NULL) {
		fprintf(stderr, "`%s`: %s\n", file_path, strerror(errno));
		return NULL;
	}

	fread (new_str, sizeof(char), new_str_len, fp);
	new_str[new_str_len] = '\0';
	fclose(fp);

	return new_str;
}

bool new_shader_from_file_path(GLenum type, GLuint *shader, const char *file_path) {
	const char *shader_source = load_file(file_path);

	if(shader_source == NULL) {
		return false;
	}

	*shader = glCreateShader(type);

	int return_value;
	char compile_log[512];

	glShaderSource(*shader, 1, &shader_source, NULL);
	LOG_INFO("Compiling shader");
	glCompileShader(*shader);
	glGetShaderiv(*shader, GL_COMPILE_STATUS, &return_value);
	if(return_value == GL_FALSE) {
		glGetShaderInfoLog(*shader, 512, NULL, compile_log);
		*shader = 0;
		LOG_ERROR("Compilation of shader failed");
		// LOG_ERROR(strstr(compile_log, "error:") + 7);
		fprintf(stderr, "%s", compile_log);
		return false;
	}

	return true;
}


bool new_program_from_shaders(GLuint *shader_program,
		GLuint *vertex_shader, GLuint *fragment_shader) {

	int return_value;
	char link_log[512];

	// link both vertex and fragment shaders
	*shader_program = glCreateProgram();

	glAttachShader(*shader_program, *vertex_shader);
	glAttachShader(*shader_program, *fragment_shader);
	LOG_INFO("Linking `vertex_shader` and `fragment_shader`");
	glLinkProgram(*shader_program);
	glGetProgramiv(*shader_program, GL_LINK_STATUS, &return_value);
	if(return_value == GL_FALSE) {
		glGetProgramInfoLog(*shader_program, 512, NULL, link_log);
		LOG_ERROR("Linking `vertex_shader` and `fragment_shader` failed");
		LOG_ERROR(link_log + 7); // remove the `error: ` prefix of message
	}
}

bool new_program_from_shaders_source(GLuint *shader_program,
		const char *vert_shader_file_path, const char *frag_shader_file_path) {

	GLuint vertex_shader, fragment_shader;

	if(!new_shader_from_file_path(GL_VERTEX_SHADER,
				&vertex_shader, vert_shader_file_path)) {

		return false;
	}

	if(!new_shader_from_file_path(GL_FRAGMENT_SHADER,
				&fragment_shader, frag_shader_file_path)) {

		return false;
	}

	if(!new_program_from_shaders(shader_program, &vertex_shader, &fragment_shader)) {
		return false;
	}

	// program with shaders compiled and linked properly
	return true;
}

GLuint current_program;

bool reload_shaders(const char *vert_shader_file_path, const char *frag_shader_file_path) {
	LOG_INFO("Reloading shaders");

	GLuint new_program;
	if(!new_program_from_shaders_source(&new_program,
			vert_shader_file_path, frag_shader_file_path)) {

		LOG_ERROR("Could not recompile shaders. Keeping previous version");
		return false;
	}
	glDeleteProgram(current_program);
	current_program = new_program;
	LOG_INFO("Done reloading shaders");
	return true;
}

// https://www.glfw.org/docs/3.3/group__keys.html
static void key_handler(GLFWwindow *window,
		int key, int scancode, int action, int mods) {

	if(action == GLFW_PRESS) {
		switch(key) {
			case GLFW_KEY_ESCAPE:
			case GLFW_KEY_Q:
				glfwSetWindowShouldClose(window, GLFW_TRUE);
				break;
			case GLFW_KEY_F5:
				reload_shaders("main.vert", "main.frag");
				break;
			default:
				break;
		}
	}
}

bool setup_glfw(GLFWwindow **window) {
	glfwInit();
	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

	*window = glfwCreateWindow(800, 800, WINDOW_TITLE, NULL, NULL);
	if (*window == NULL) {
		LOG_ERROR("Failed to create GLFW window");
		glfwTerminate();
		return false;
	}

	glfwMakeContextCurrent(*window);
	if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
		LOG_ERROR("Failed to initialize GLAD");
		glfwTerminate();
		return false;
	}

	// bind key_hadler
	glfwSetKeyCallback(*window, key_handler);

	// bind the callback whiech sets the rendering context size on window resize
	glfwSetFramebufferSizeCallback(*window, framebuffer_size_callback);
	return true;
}

int main (void) {
	GLuint VBO, VAO; // Vertex Buffer Objects, Vertex Array Object
	GLFWwindow *window;

	float vertices[] = {
		-0.50f, -0.400f, 0.00f,
		 0.50f, -0.400f, 0.00f,
		 0.00f,  0.466f, 0.00f
	};

	setup_glfw(&window);

	glGenBuffers(1, &VBO);
	glBindBuffer(GL_ARRAY_BUFFER, VBO);
	glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

	glGenVertexArrays(1, &VAO);
	glBindVertexArray(VAO);

	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3*sizeof(float), (void*)0);
	glEnableVertexAttribArray(0);

	if(!new_program_from_shaders_source(&current_program, "main.vert", "main.frag")) {
		glfwDestroyWindow(window);
		glfwTerminate();
		return -1;
	}

	float time;
	int time_uniform = glGetUniformLocation(current_program, "time");
	while(!glfwWindowShouldClose(window)) {
		// glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
		glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
		glClear(GL_COLOR_BUFFER_BIT);

		time = glfwGetTime();
		glUseProgram(current_program);
		glUniform1f(time_uniform, time);
		
		glBindVertexArray(VAO);
		glDrawArrays(GL_TRIANGLES, 0, 3);
		glfwSwapBuffers(window);
		glfwPollEvents();
	}

	LOG_INFO("Freeing resources");
	glDeleteProgram(current_program);
	glfwDestroyWindow(window);
	glfwTerminate();
	return 0;
}
