CC := gcc
CLIBS := `pkg-config --libs glfw3` -lGL
CFLAGS := # -Wall -Wshadow -pedantic -ansi -std=c99 -O3
SRCS := $(wildcard *.c)
OBJS := $(SRCS:.c=.o)

TARGET := opengl-example

.PHONY: all clean

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(CLIBS) $(CFLAGS) -o $@ $^
	rm -f $(OBJS)

%.o: %.c
	$(CC) $(CLIBS) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS)
