#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <string.h>

#include "glad.h"
#include <GLFW/glfw3.h>

#define WINDOW_TITLE "OpenGL Example"

#define LOG_INFO(str) do {       \
	printf("[LOG]: %s\n", str);  \
} while (0)

#define LOG_ERROR(str) do {                 \
	fprintf(stderr, "[ERROR]: %s\n", str);  \
} while (0)

static void key_handler(GLFWwindow *window,
		int key, int scancode, int action, int mods) {

	if(action == GLFW_PRESS) {
		switch(key) {
			case GLFW_KEY_ESCAPE:
			case GLFW_KEY_Q:
				glfwSetWindowShouldClose(window, GLFW_TRUE);
				break;
			default:
				break;
		}
	}
}

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

int main (void) {
	glfwInit();
	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

	GLFWwindow *window = glfwCreateWindow(800, 800, WINDOW_TITLE, NULL, NULL);
	if (window == NULL) {
		LOG_ERROR("Failed to create GLFW window");
		glfwTerminate();
		return -1;
	}

	glfwMakeContextCurrent(window);
	if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
		LOG_ERROR("Failed to initialize GLAD");
		glfwTerminate();
		return -1;
	}

	// bind key_hadler
	glfwSetKeyCallback(window, key_handler);

	// bind the callback whiech sets the rendering context size on window resize
	glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

	const char *vertex_shader_source, *fragment_shader_source;
	unsigned int vertex_shader, fragment_shader, shader_program;
	int return_value;
	char infoLog[512];

	float vertices[] = {
		-0.50f, -0.400f, 0.00f,
		 0.50f, -0.400f, 0.00f,
		 0.00f,  0.466f, 0.00f
	};

	unsigned int VBO, VAO; // Vertex Buffer Objects, Vertex Array Object
	glGenBuffers(1, &VBO);
	glBindBuffer(GL_ARRAY_BUFFER, VBO);
	glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

	glGenVertexArrays(1, &VAO);
	glBindVertexArray(VAO);

	// fragment shader load and compile
	vertex_shader_source = load_file("main.vert");
	if(vertex_shader_source == NULL) {
		return -1;
	}

	// puts(vertex_shader_source);

	vertex_shader = glCreateShader(GL_VERTEX_SHADER);

	glShaderSource(vertex_shader, 1, &vertex_shader_source, NULL);
	LOG_INFO("Compiling `vertex_shader`");
	glCompileShader(vertex_shader);

	glGetShaderiv(vertex_shader, GL_COMPILE_STATUS, &return_value);

	if(return_value == GL_FALSE) {
		glGetShaderInfoLog(vertex_shader, 512, NULL, infoLog);
		LOG_ERROR("Compilation of `vertex_shader` failed");
		LOG_ERROR(infoLog);
	}

	// fragment shader load and compile
	fragment_shader_source = load_file("main.frag");
	if(fragment_shader_source == NULL) {
		return -1;
	}

	// puts(fragment_shader_source);

	fragment_shader = glCreateShader(GL_FRAGMENT_SHADER);

	glShaderSource(fragment_shader, 1, &fragment_shader_source, NULL);
	LOG_INFO("Compiling `fragment_shader`");
	glCompileShader(fragment_shader);
	glGetShaderiv(fragment_shader, GL_COMPILE_STATUS, &return_value);
	if(return_value == GL_FALSE) {
		glGetShaderInfoLog(fragment_shader, 512, NULL, infoLog);
		LOG_ERROR("Compilation of `fragment_shader` failed");
		LOG_ERROR(infoLog);
	}

	// link both vertex and fragment shaders
	shader_program = glCreateProgram();

	glAttachShader(shader_program, vertex_shader);
	glAttachShader(shader_program, fragment_shader);
	LOG_INFO("Linking `vertex_shader` and `fragment_shader`");
	glLinkProgram(shader_program);

	glGetProgramiv(shader_program, GL_LINK_STATUS, &return_value);
	if(return_value == GL_FALSE) {
		glGetProgramInfoLog(shader_program, 512, NULL, infoLog);
		LOG_ERROR("Linking `vertex_shader` and `fragment_shader` failed");
		LOG_ERROR(infoLog + 7); // remove the `error: ` prefix of message
	}

	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3*sizeof(float), (void*)0);
	glEnableVertexAttribArray(0);
	glUseProgram(shader_program);

	while(!glfwWindowShouldClose(window)) {
		glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
		glClear(GL_COLOR_BUFFER_BIT);
		glBindVertexArray(VAO);
		glDrawArrays(GL_TRIANGLES, 0, 3);
		glfwSwapBuffers(window);
		glfwPollEvents();
	}

	glDeleteShader(vertex_shader);
	glDeleteShader(fragment_shader);
	glfwDestroyWindow(window);
	glfwTerminate();
	return 0;
}
